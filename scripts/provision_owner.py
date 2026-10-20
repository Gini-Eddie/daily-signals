"""Run on the Python host: python scripts/provision_owner.py <owner-email>."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from auth import AppState, password_hash, digest
from database import Base, engine, SessionLocal

email = os.environ.get("OWNER_EMAIL") or (sys.argv[1] if len(sys.argv) > 1 else "")
if "@" not in email:
    raise SystemExit("Provide OWNER_EMAIL or an email argument.")
Base.metadata.create_all(bind=engine)
password = secrets.token_urlsafe(18)
recovery = secrets.token_hex(24)
with SessionLocal() as db:
    if db.get(AppState, "account"):
        raise SystemExit("An account already exists. Nothing was changed.")
    account = {"email": email.strip().lower(), "password": password_hash(password), "recovery": digest(recovery), "role": "owner", "must_change_password": True}
    access_file = Path(os.environ.get("OWNER_ACCESS_FILE", "data/owner-access.txt"))
    access_file.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(access_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as output:
        output.write(f"Daily Signals — private owner access\n\nEmail: {account['email']}\nInitial password: {password}\nRecovery code: {recovery}\n\nSign in and choose your own password. Save the recovery code privately, then delete this file.\n")
    db.add(AppState(key="account", value=json.dumps(account)))
    db.commit()
print("Owner account created. Private credentials saved to:", access_file.resolve())
