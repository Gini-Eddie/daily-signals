from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal
from models import User

router = APIRouter(prefix="/user", tags=["User"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserProfileUpdate(BaseModel):
    name: str
    role: str | None = None
    motto: str | None = None

class CheckInRequest(BaseModel):
    date: str | None = None

@router.get("/profile")
def get_user_profile(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == 1).first()
    return {
        "name": user.full_name if user else "Daily Signals User",
        "role": "Machine Learning & Automation Engineer",
        "motto": "Measure execution. Study the trend. Improve the system."
    }

@router.post("/profile")
def save_user_profile(payload: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == 1).first()
    if user:
        user.full_name = payload.name
        db.commit()
    return {
        "name": payload.name,
        "role": payload.role or "Machine Learning & Automation Engineer",
        "motto": payload.motto or "Measure execution."
    }

@router.post("/checkin")
def check_in_user(payload: CheckInRequest):
    return {
        "name": "User",
        "checked_in_today": True,
        "checkin_streak": 1,
        "message": "Checked in successfully"
    }