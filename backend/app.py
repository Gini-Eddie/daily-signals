"""
Daily Signals - FastAPI Application Entry Point

Philosophy:
"Measure execution. Study the trend. Improve the system."
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base, SessionLocal
from models import User, Category, Habit, TrackingType
from auth import router as auth_router, authenticated, read_state, write_state
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import date as Date, timedelta, datetime, timezone
from fastapi import HTTPException
from models import HabitEntry

# CRITICAL FIX 1: Removed 'user' from this import list so the server does not crash
from routers import categories, habits, entries, signals, reflections, dashboard, analytics, goals

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Daily Signals - Personal Execution & Habit Tracking System"
)

@app.middleware("http")
async def protect_account(request: Request, call_next):
    if request.method != "OPTIONS" and request.url.path.startswith("/api/") and not request.url.path.startswith("/api/auth/") and not authenticated(request):
        return JSONResponse({"detail": "Please sign in."}, status_code=401)
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response

# CRITICAL FIX 2: Explicitly define the Vercel origin to prevent CORS crashes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://daily-signals-eight.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST API Routers - Prefixes stack perfectly to match React (e.g. /api/habits)
app.include_router(dashboard.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(entries.router, prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(reflections.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(goals.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "app": settings.PROJECT_NAME, "version": settings.VERSION}


# --- MISSING ENDPOINTS REQUIRED BY VERCEL FRONTEND ---

@app.get("/api/backend-code", tags=["System"])
def get_backend_code():
    return {"app.py": "# Backend code is secured and running natively on Render."}

@app.post("/api/reset-starter-data", tags=["System"])
def reset_data():
    try:
        seed_starter_data()
    except Exception as e:
        print(f"Reset error: {e}")
    return {"status": "success"}


# --- FALLBACK USER ROUTES ---

@app.get("/api/user/profile", tags=["User"])
def get_profile():
    with SessionLocal() as db:
        existing_user = db.get(User, 1)
        existing_name = existing_user.full_name if existing_user and existing_user.full_name else "Ginikachukwu Edward"
        if existing_name in ("Daily Signals User", "My Daily Signals"):
            existing_name = "Ginikachukwu Edward"
    profile = read_state("profile", {
        "name": existing_name,
        "role": "Machine Learning and Automation Engineer",
        "motto": "Measure execution. Study the trend. Improve the system.",
        "checked_in_today": True,
        "checkin_streak": 1
    })
    checkins = read_state("checkins", [])
    cursor = Date.today() if Date.today().isoformat() in checkins else Date.today() - timedelta(days=1)
    streak = 0
    while cursor.isoformat() in checkins:
        streak += 1
        cursor -= timedelta(days=1)
    return {**profile, "checked_in_today": Date.today().isoformat() in checkins, "checkin_streak": streak}

@app.post("/api/user/profile", tags=["User"])
def save_profile(payload: dict):
    profile = {**get_profile(), **{k: str(v) for k, v in payload.items() if k in ("name", "role", "motto")}}
    write_state("profile", profile)
    return get_profile()

@app.post("/api/user/checkin", tags=["User"])
def check_in(payload: dict):
    day = Date.fromisoformat(payload.get("date") or Date.today().isoformat()).isoformat()
    checkins = read_state("checkins", [])
    if day not in checkins:
        checkins.append(day)
        write_state("checkins", checkins)
    return {**get_profile(), "message": "Checked in successfully"}


# --- FALLBACK PUBLISH ROUTES ---

@app.get("/api/publish/status", tags=["Publish"])
def get_publish_status(date: str = None):
    day = Date.fromisoformat(date or Date.today().isoformat()).isoformat()
    publication = read_state("publication:" + day)
    return {"date": day, "is_published": bool(publication), "publication": publication}

@app.post("/api/publish", tags=["Publish"])
def publish_day(payload: dict):
    day = Date.fromisoformat(payload.get("date") or Date.today().isoformat())
    with SessionLocal() as db:
        dash = dashboard.get_today_dashboard(target_date=day, db=db)
    publication = {
        "date": day.isoformat(),
        "day_name": dash.day_name,
        "is_published": True,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "published_by": get_profile()["name"],
        "notes": payload.get("notes", ""),
        "execution_score": dash.execution_score,
        "habits_count": dash.habits_scheduled_count,
        "habits_completed": dash.habits_completed_count,
        "minimums_achieved": dash.minimum_achieved_count,
        "verification_status": "VERIFIED_READY" if dash.execution_score >= 100 else "VERIFIED_PARTIAL" if dash.execution_score > 0 else "VERIFIED_BLANK"
    }
    write_state("publication:" + day.isoformat(), publication)
    return publication


@app.post("/api/entries/clear-day")
def clear_day(payload: dict):
    day = Date.fromisoformat(payload.get("date") or Date.today().isoformat())
    with SessionLocal() as db:
        habit_ids = db.query(Habit.id).filter(Habit.user_id == 1)
        db.query(HabitEntry).filter(HabitEntry.habit_id.in_(habit_ids), HabitEntry.entry_date == day).delete(synchronize_session=False)
        db.commit()
    write_state("publication:" + day.isoformat(), None)
    return {"status": "cleared", "date": day.isoformat(), "message": "Day cleared"}


def seed_starter_data():
    with SessionLocal() as db:
        if not db.get(User, 1):
            db.add(User(id=1, email="personal@localhost", full_name="My Daily Signals"))
            db.commit()

@app.on_event("startup")
def startup_event():
    try:
        seed_starter_data()
    except Exception as e:
        print(f"Starter seed check: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
