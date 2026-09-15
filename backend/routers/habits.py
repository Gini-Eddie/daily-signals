"""
Daily Signals - Habits Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Habit, Category
from backend.schemas import HabitCreate, HabitUpdate, HabitResponse

router = APIRouter(prefix="/habits", tags=["Habits"])


def get_current_user_id() -> int:
    return 1


@router.get("", response_model=List[HabitResponse])
def get_habits(
    include_archived: bool = Query(False),
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    query = db.query(Habit).filter(Habit.user_id == user_id)
    
    if not include_archived:
        query = query.filter(Habit.is_active == True)
    
    if category_id is not None:
        query = query.filter(Habit.category_id == category_id)
        
    habits = query.order_by(Habit.display_order, Habit.id).all()
    return habits


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()

    # Rule verification: Execution vs Outcome
    # We warn / guide if user enters obvious financial outcome in execution habits
    name_lower = payload.name.lower()
    if any(term in name_lower for term in ["save ₦", "save $", "rent available", "account balance", "bank balance"]):
        raise HTTPException(
            status_code=400, 
            detail="Daily Signals measures controllable execution (actions you take), not passive financial outcomes (e.g. saving money). Measure controllable actions instead (e.g., prospect calls, hours worked)."
        )

    habit = Habit(
        user_id=user_id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        tracking_type=payload.tracking_type,
        unit=payload.unit,
        minimum_value=payload.minimum_value,
        target_value=payload.target_value,
        applicable_days=payload.applicable_days,
        is_active=payload.is_active,
        display_order=payload.display_order or 0
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, payload: HabitUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    db.delete(habit)
    db.commit()
    return None
