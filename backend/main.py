"""
Daily Signals - FastAPI Application Entry Point

Philosophy:
"Measure execution. Study the trend. Improve the system."
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import User, Category, Habit, TrackingType
from backend.routers import categories, habits, entries, signals, reflections, dashboard, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Daily Signals - Personal Execution & Habit Tracking System"
)

# CORS middleware for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(habits.router, prefix=settings.API_PREFIX)
app.include_router(categories.router, prefix=settings.API_PREFIX)
app.include_router(entries.router, prefix=settings.API_PREFIX)
app.include_router(signals.router, prefix=settings.API_PREFIX)
app.include_router(reflections.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "app": settings.PROJECT_NAME, "version": settings.VERSION}


def seed_starter_data():
    """Seeds the starter categories and habits defined in Daily Signals specification"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(id=1, email="user@dailysignals.app", full_name="Daily Signals User")
            db.add(user)
            db.commit()
            db.refresh(user)

        if db.query(Category).filter(Category.user_id == user.id).count() == 0:
            starters = [
                {
                    "name": "Spiritual",
                    "color": "#8b5cf6",
                    "habits": [
                        {"name": "Morning Prayer", "type": TrackingType.BINARY, "desc": "Controllable spiritual discipline"},
                        {"name": "Bible Study / Quiet Time", "type": TrackingType.BINARY, "desc": "Daily quiet study time"},
                    ]
                },
                {
                    "name": "Health",
                    "color": "#10b981",
                    "habits": [
                        {"name": "Exercise", "type": TrackingType.MINIMUM_TARGET, "unit": "minutes", "min": 15, "target": 45, "desc": "Physical training"},
                        {"name": "Push-ups", "type": TrackingType.QUANTITY, "unit": "reps", "target": 60, "desc": "Upper body push reps"},
                        {"name": "Sit-ups", "type": TrackingType.QUANTITY, "unit": "reps", "target": 10, "desc": "Core abdominal reps"},
                    ]
                },
                {
                    "name": "Personal Development",
                    "color": "#0ea5e9",
                    "habits": [
                        {"name": "Journaling", "type": TrackingType.BINARY, "desc": "Clarity journaling and review"},
                        {"name": "Reading", "type": TrackingType.MINIMUM_TARGET, "unit": "pages", "min": 5, "target": 10, "desc": "Deep reading in focus books"},
                        {"name": "Daily Planning", "type": TrackingType.BINARY, "desc": "Pre-day execution block layout"},
                    ]
                },
                {
                    "name": "AI Engineering / Career",
                    "color": "#f59e0b",
                    "habits": [
                        {"name": "AI Engineering Block", "type": TrackingType.MINIMUM_TARGET, "unit": "minutes", "min": 20, "target": 60, "desc": "Core hands-on coding & modeling"},
                        {"name": "Course / Learning Time", "type": TrackingType.MINIMUM_TARGET, "unit": "minutes", "min": 30, "target": 60, "desc": "Technical course time"},
                        {"name": "Career Opportunity Actions", "type": TrackingType.QUANTITY, "unit": "actions", "target": 2, "desc": "Proactive career pipeline moves"},
                        {"name": "Job Applications", "type": TrackingType.QUANTITY, "unit": "applications", "target": 2, "desc": "Targeted tailored applications"},
                        {"name": "Professional Outreach", "type": TrackingType.QUANTITY, "unit": "outreaches", "target": 3, "desc": "Direct networking and peer outreach"},
                    ]
                },
                {
                    "name": "Content / Positioning",
                    "color": "#ec4899",
                    "habits": [
                        {"name": "Content Created", "type": TrackingType.BINARY, "desc": "Drafted engineering or insight post"},
                        {"name": "Content Published", "type": TrackingType.BINARY, "desc": "Published public work"},
                        {"name": "Tomorrow's Content Prepared / Scheduled", "type": TrackingType.BINARY, "desc": "Asset scheduled in advance"},
                    ]
                },
                {
                    "name": "Business",
                    "color": "#6366f1",
                    "habits": [
                        {"name": "PropNode Daily Execution", "type": TrackingType.MINIMUM_TARGET, "unit": "minutes", "min": 30, "target": 90, "desc": "Controllable work block for PropNode"},
                        {"name": "Prospect Calls", "type": TrackingType.QUANTITY, "unit": "calls", "target": 5, "desc": "Outbound sales prospect calls"},
                        {"name": "Follow-ups", "type": TrackingType.QUANTITY, "unit": "outreaches", "target": 5, "desc": "Timely prospect pipeline follow-ups"},
                    ]
                }
            ]

            order_idx = 0
            for s in starters:
                cat = Category(
                    user_id=user.id,
                    name=s["name"],
                    color=s["color"],
                    display_order=order_idx
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
                order_idx += 1

                habit_order = 0
                for h_data in s["habits"]:
                    habit = Habit(
                        user_id=user.id,
                        category_id=cat.id,
                        name=h_data["name"],
                        description=h_data.get("desc"),
                        tracking_type=h_data["type"],
                        unit=h_data.get("unit"),
                        minimum_value=h_data.get("min"),
                        target_value=h_data.get("target"),
                        applicable_days=[0, 1, 2, 3, 4, 5, 6],
                        is_active=True,
                        display_order=habit_order
                    )
                    db.add(habit)
                    habit_order += 1
                db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    try:
        seed_starter_data()
    except Exception as e:
        print(f"Starter seed check: {e}")
