"""
Daily Signals - Daily Reflection Router

End-of-day reflection:
1. What went well?
2. What interfered with execution?
3. What will I adjust tomorrow?
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import DailyReflection
from schemas import DailyReflectionCreate, DailyReflectionResponse

router = APIRouter(prefix="/reflections", tags=["Daily Reflections"])


def get_current_user_id() -> int:
    return 1


@router.get("", response_model=Optional[DailyReflectionResponse])
def get_reflection_for_date(
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    reflection = db.query(DailyReflection).filter(
        DailyReflection.user_id == user_id,
        DailyReflection.reflection_date == target_date
    ).first()
    return reflection


@router.post("", response_model=DailyReflectionResponse)
def save_reflection(payload: DailyReflectionCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    
    reflection = db.query(DailyReflection).filter(
        DailyReflection.user_id == user_id,
        DailyReflection.reflection_date == payload.reflection_date
    ).first()

    if reflection:
        reflection.what_went_well = payload.what_went_well
        reflection.what_interfered = payload.what_interfered
        reflection.what_to_adjust = payload.what_to_adjust
    else:
        reflection = DailyReflection(
            user_id=user_id,
            reflection_date=payload.reflection_date,
            what_went_well=payload.what_went_well,
            what_interfered=payload.what_interfered,
            what_to_adjust=payload.what_to_adjust
        )
        db.add(reflection)

    db.commit()
    db.refresh(reflection)
    return reflection
