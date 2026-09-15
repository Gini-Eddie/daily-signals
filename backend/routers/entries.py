"""
Daily Signals - Habit Entries Router
Fast daily logging: save/update entry for a given habit and date.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import HabitEntry, Habit
from backend.schemas import HabitEntryCreate, HabitEntryResponse

router = APIRouter(prefix="/habit-entries", tags=["Habit Entries"])


def get_current_user_id() -> int:
    return 1


@router.post("", response_model=HabitEntryResponse)
def log_or_update_entry(payload: HabitEntryCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    
    # Verify habit ownership
    habit = db.query(Habit).filter(Habit.id == payload.habit_id, Habit.user_id == user_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Upsert entry for date
    entry = db.query(HabitEntry).filter(
        HabitEntry.habit_id == payload.habit_id,
        HabitEntry.entry_date == payload.entry_date
    ).first()

    if entry:
        entry.actual_value = payload.actual_value
        entry.binary_completed = payload.binary_completed
        if payload.notes is not None:
            entry.notes = payload.notes
    else:
        entry = HabitEntry(
            habit_id=payload.habit_id,
            entry_date=payload.entry_date,
            actual_value=payload.actual_value,
            binary_completed=payload.binary_completed,
            notes=payload.notes
        )
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return entry
