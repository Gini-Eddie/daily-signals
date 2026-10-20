"""Run with Python and backend dependencies installed; uses a disposable SQLite DB."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend"))
temp = tempfile.TemporaryDirectory(prefix="daily-signals-python-")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(temp.name) / "test.db")
os.environ["ACCOUNT_SETUP_KEY"] = "test-only-setup-key"
from fastapi.testclient import TestClient
from app import app
from database import engine


class BackendTest(unittest.TestCase):
    def test_account_backfill_and_recovery(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/habits").status_code, 401)
            credentials = {"email": "owner@example.com", "password": "a-long-test-password"}
            self.assertEqual(client.post("/api/auth/register", json=credentials).status_code, 403)
            response = client.post("/api/auth/register", json={**credentials, "setup_key": "test-only-setup-key"})
            self.assertEqual(response.status_code, 200, response.text)
            account = response.json()
            client.headers["Authorization"] = "Bearer " + account["token"]
            goal = client.post("/api/weekly-goals", json={"week_start": "2026-10-19", "title": "Work out four times", "target": 4, "unit": "workouts"})
            self.assertEqual(goal.status_code, 201, goal.text)
            goal_id = goal.json()["id"]
            self.assertEqual(client.put(f"/api/weekly-goals/{goal_id}", json={"progress": 3}).json()["progress"], 3)
            self.assertEqual(len(client.get("/api/weekly-goals?week_start=2026-10-19").json()), 1)
            self.assertEqual(client.get("/api/weekly-goals?week_start=2026-10-12").json(), [])
            self.assertEqual(client.put(f"/api/weekly-goals/{goal_id}", json={"target": 0}).status_code, 400)
            self.assertEqual(client.delete(f"/api/weekly-goals/{goal_id}").status_code, 204)
            habit = client.post("/api/habits", json={"name": "Reading", "tracking_type": "MINIMUM_TARGET", "minimum_value": 5, "target_value": 10}).json()
            self.assertIn("id", habit)
            response = client.put(f'/api/habits/{habit["id"]}', json={"target_value": 20})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(client.put(f'/api/habits/{habit["id"]}', json={"target_value": 2}).status_code, 400)
            entry = {"habit_id": habit["id"], "entry_date": "2026-10-19", "actual_value": 12}
            self.assertEqual(client.post("/api/habit-entries", json=entry).status_code, 200)
            client.post("/api/habit-entries", json={"habit_id": habit["id"], "entry_date": "2026-10-19", "notes": "Backfilled"})
            day = client.get("/api/history/2026-10-19").json()
            self.assertEqual(day["habits"][0]["entry"]["actual_value"], 12)
            self.assertEqual(client.get("/api/dashboard/today?date=2026-10-19").json()["date"], "2026-10-19")
            for i in range(1, 4):
                signal = {"signal_date": "2026-10-19", "order_position": i, "title": f"Signal {i}"}
                self.assertEqual(client.post("/api/daily-signals", json=signal).status_code, 201)
            self.assertEqual(client.post("/api/daily-signals", json={**signal, "title": "Edited third signal"}).status_code, 201)
            self.assertEqual(len(client.get("/api/daily-signals?date=2026-10-19").json()), 3)
            profile = client.post("/api/user/profile", json={"name": "Test Owner"}).json()
            self.assertEqual(client.get("/api/user/profile").json()["name"], profile["name"])
            publication = client.post("/api/publish", json={"date": "2026-10-19"}).json()
            self.assertEqual(publication["execution_score"], day["execution_score"])
            self.assertTrue(client.get("/api/history/2026-10-19").json()["publication"]["is_published"])
            recovered = client.post("/api/auth/recover", json={**credentials, "password": "a-new-long-password", "recovery_code": account["recovery_code"]})
            self.assertEqual(recovered.status_code, 200, recovered.text)
            self.assertEqual(client.get("/api/habits").status_code, 401)
            self.assertEqual(client.post("/api/auth/login", json=credentials).status_code, 400)
            login = client.post("/api/auth/login", json={**credentials, "password": "a-new-long-password"})
            self.assertEqual(login.status_code, 200)
            client.headers["Authorization"] = "Bearer " + login.json()["token"]
            changed = client.post("/api/auth/change-password", json={"current_password": "a-new-long-password", "password": "another-long-private-password"})
            self.assertEqual(changed.status_code, 200, changed.text)
            self.assertEqual(client.get("/api/habits").status_code, 401)


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        engine.dispose()
        temp.cleanup()
