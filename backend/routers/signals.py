"""
Daily Signals - Today's 3 Signals Router

Represents the three most important controllable actions for the day.
Up to three signals allowed per date.
"""
from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import DailySignal
from schemas import DailySignalCreate, DailySignalUpdate, DailySignalResponse

router = APIRouter(prefix="/daily-signals", tags=["Daily Signals"])


def get_current_user_id() -> int:
    return 1


@router.get("", response_model=List[DailySignalResponse])
def get_signals_for_date(
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    signals = db.query(DailySignal).filter(
        DailySignal.user_id == user_id,
        DailySignal.signal_date == target_date
    ).order_by(DailySignal.order_position).all()
    return signals


@router.post("", response_model=DailySignalResponse, status_code=status.HTTP_201_CREATED)
def create_signal(payload: DailySignalCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()

    # Verify maximum 3 signals per day
    count = db.query(DailySignal).filter(
        DailySignal.user_id == user_id,
        DailySignal.signal_date == payload.signal_date
    ).count()

    if count >= 3:
        raise HTTPException(
            status_code=400,
            detail="Maximum of 3 priority signals allowed per day to preserve extreme daily focus."
        )

    # Check if slot already exists
    existing = db.query(DailySignal).filter(
        DailySignal.user_id == user_id,
        DailySignal.signal_date == payload.signal_date,
        DailySignal.order_position == payload.order_position
    ).first()

    if existing:
        # Update existing slot
        existing.title = payload.title
        existing.category_name = payload.category_name
        existing.description = payload.description
        existing.target_quantity = payload.target_quantity
        existing.is_completed = payload.is_completed
        db.commit()
        db.refresh(existing)
        return existing

    signal = DailySignal(
        user_id=user_id,
        signal_date=payload.signal_date,
        order_position=payload.order_position,
        title=payload.title,
        category_name=payload.category_name,
        description=payload.description,
        target_quantity=payload.target_quantity,
        is_completed=payload.is_completed
    )
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal


@router.put("/{signal_id}", response_model=DailySignalResponse)
def update_signal(signal_id: int, payload: DailySignalUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    signal = db.query(DailySignal).filter(
        DailySignal.id == signal_id,
        DailySignal.user_id == user_id
    ).first()

    if not signal:
        raise HTTPException(status_code=404, detail="Daily signal not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(signal, field, value)

    db.commit()
    db.refresh(signal)
    return signal


@router.delete("/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_signal(signal_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    signal = db.query(DailySignal).filter(
        DailySignal.id == signal_id,
        DailySignal.user_id == user_id
    ).first()

    if not signal:
        raise HTTPException(status_code=404, detail="Daily signal not found")

    db.delete(signal)
    db.commit()
    return None
