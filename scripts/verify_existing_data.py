"""Read-only backup of the existing personal user before owner provisioning."""
import json
import os
from pathlib import Path
import sys
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from config import settings
from sqlalchemy import create_engine, inspect, MetaData, Table, select, text

engine = create_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1), connect_args={"connect_timeout": 10})
try:
    names = inspect(engine).get_table_names()
    tables = {name: Table(name, MetaData(), autoload_with=engine) for name in ("users", "habits", "categories", "habit_entries", "daily_signals", "daily_reflections") if name in names}
    data = {}
    with engine.connect() as conn:
        conn.execute(text("SET TRANSACTION READ ONLY"))
        for name, table in tables.items():
            columns = [c for c in table.c if not any(word in c.name.lower() for word in ("password", "secret", "token"))]
            query = select(*columns)
            if name == "users":
                query = query.where(table.c.id == 1)
            elif "user_id" in table.c:
                query = query.where(table.c.user_id == 1)
            elif name == "habit_entries":
                query = query.where(table.c.habit_id.in_(select(tables["habits"].c.id).where(tables["habits"].c.user_id == 1)))
            data[name] = [dict(row) for row in conn.execute(query).mappings()]
        owner_exists = False
        if "daily_signals_state" in names:
            state = Table("daily_signals_state", MetaData(), autoload_with=engine)
            owner_exists = conn.execute(select(state.c.key).where(state.c.key == "account")).first() is not None
    backup = Path("data/backups") / ("hosted-before-owner-" + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + ".json")
    backup.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as output:
        json.dump(data, output, default=str, indent=2)
    print(json.dumps({"counts": {name: len(rows) for name, rows in data.items()}, "profile_name": data.get("users", [{}])[0].get("full_name") if data.get("users") else None, "owner_account_exists": owner_exists, "backup": str(backup)}))
except Exception as error:
    print("Could not verify the configured database:", type(error).__name__, "— no existing data was changed.")
    sys.exit(1)
finally:
    engine.dispose()
