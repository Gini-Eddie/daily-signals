"""
Daily Signals - Dashboard & History Router
"""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Habit, HabitEntry, DailySignal, DailyReflection, TrackingType
from schemas import TodayDashboardResponse, HabitWithExecution, HabitResponse, HabitEntryResponse
from services.execution import evaluate_habit_status, calculate_daily_execution_score

router = APIRouter(tags=["Dashboard & History"])


def get_current_user_id() -> int:
    return 1


@router.get("/dashboard/today", response_model=TodayDashboardResponse)
def get_today_dashboard(
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    day_name = target_date.strftime("%A")
    day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday

    # Fetch active habits for user
    habits = db.query(Habit).filter(
        Habit.user_id == user_id,
        Habit.is_active == True
    ).order_by(Habit.display_order, Habit.id).all()

    # Fetch entries for target_date
    habit_ids = [h.id for h in habits]
    entries = db.query(HabitEntry).filter(
        HabitEntry.habit_id.in_(habit_ids),
        HabitEntry.entry_date == target_date
    ).all() if habit_ids else []

    entries_map = {e.habit_id: e for e in entries}

    # Fetch signals
    signals = db.query(DailySignal).filter(
        DailySignal.user_id == user_id,
        DailySignal.signal_date == target_date
    ).order_by(DailySignal.order_position).all()

    # Fetch reflection
    reflection = db.query(DailyReflection).filter(
        DailyReflection.user_id == user_id,
        DailyReflection.reflection_date == target_date
    ).first()

    # Calculate execution metrics
    metrics = calculate_daily_execution_score(habits, entries_map, target_date)

    # Build habits with execution status
    habits_with_exec = []
    for h in habits:
        is_scheduled = day_of_week in (h.applicable_days or [])
        entry = entries_map.get(h.id)
        status, score_pts, actual_val = evaluate_habit_status(h, entry)

        entry_resp = HabitEntryResponse.model_validate(entry) if entry else None
        habit_resp = HabitResponse.model_validate(h)

        habits_with_exec.append(
            HabitWithExecution(
                habit=habit_resp,
                entry=entry_resp,
                status=status,
                is_scheduled_today=is_scheduled,
                actual_value=actual_val,
                binary_completed=bool(entry.binary_completed) if entry else False,
                execution_score_points=score_pts
            )
        )

    return TodayDashboardResponse(
        date=target_date,
        day_name=day_name,
        execution_score=metrics["score"],
        habits_scheduled_count=metrics["scheduled_count"],
        habits_completed_count=metrics["completed_count"],
        habits_remaining_count=metrics["remaining_count"],
        minimum_achieved_count=metrics["min_achieved_count"],
        full_target_achieved_count=metrics["target_achieved_count"],
        minimum_progress_pct=metrics["min_progress_pct"],
        full_target_progress_pct=metrics["target_progress_pct"],
        signals=signals,
        habits=habits_with_exec,
        reflection=reflection
    )


@router.get("/history/{history_date}", response_model=TodayDashboardResponse)
def get_history_by_date(history_date: date, db: Session = Depends(get_db)):
    """Retrieve full execution record and dashboard for any historical date"""
    return get_today_dashboard(target_date=history_date, db=db)
