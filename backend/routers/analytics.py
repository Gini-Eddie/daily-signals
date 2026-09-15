"""
Daily Signals - Weekly Analytics & Weekly Review Router
"""
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Habit, HabitEntry, TrackingType
from schemas import WeeklyAnalyticsResponse, WeeklyReviewResponse, HabitWeeklyMetric
from services.execution import evaluate_habit_status, generate_weekly_review_diagnosis

router = APIRouter(prefix="/analytics", tags=["Analytics & Review"])


def get_current_user_id() -> int:
    return 1


@router.get("/weekly", response_model=WeeklyAnalyticsResponse)
def get_weekly_analytics(
    week_offset: int = Query(0, description="0 for current week, -1 for last week, etc."),
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    today = date.today()
    
    # Calculate Monday of current week
    current_monday = today - timedelta(days=today.weekday())
    target_monday = current_monday + timedelta(weeks=week_offset)
    target_sunday = target_monday + timedelta(days=6)
    prev_monday = target_monday - timedelta(days=7)
    prev_sunday = target_monday - timedelta(days=1)

    habits = db.query(Habit).filter(
        Habit.user_id == user_id,
        Habit.is_active == True
    ).order_by(Habit.display_order, Habit.id).all()

    # Query entries for target week and previous week
    all_habit_ids = [h.id for h in habits]
    
    target_entries = db.query(HabitEntry).filter(
        HabitEntry.habit_id.in_(all_habit_ids),
        HabitEntry.entry_date >= target_monday,
        HabitEntry.entry_date <= target_sunday
    ).all() if all_habit_ids else []

    prev_entries = db.query(HabitEntry).filter(
        HabitEntry.habit_id.in_(all_habit_ids),
        HabitEntry.entry_date >= prev_monday,
        HabitEntry.entry_date <= prev_sunday
    ).all() if all_habit_ids else []

    # Map entries by (habit_id, date)
    target_map = {(e.habit_id, e.entry_date): e for e in target_entries}
    prev_map = {(e.habit_id, e.entry_date): e for e in prev_entries}

    habit_metrics: List[HabitWeeklyMetric] = []
    daily_scores = []
    
    days_list = [target_monday + timedelta(days=i) for i in range(7)]

    # Compute daily execution scores across the 7 days
    total_week_score = 0.0
    for d in days_list:
        day_weekday = d.weekday()
        day_scheduled = [h for h in habits if day_weekday in (h.applicable_days or [])]
        if not day_scheduled:
            daily_scores.append({"date": str(d), "day": d.strftime("%a"), "score": 0.0})
            continue

        day_sum = 0.0
        for h in day_scheduled:
            entry = target_map.get((h.id, d))
            _, score, _ = evaluate_habit_status(h, entry)
            day_sum += score
        
        day_score = round(day_sum / len(day_scheduled), 1)
        daily_scores.append({"date": str(d), "day": d.strftime("%a"), "score": day_score})
        total_week_score += day_score

    overall_week_score = round(total_week_score / 7.0, 1)

    # Compute previous week overall score
    prev_days_list = [prev_monday + timedelta(days=i) for i in range(7)]
    prev_total_score = 0.0
    for d in prev_days_list:
        day_weekday = d.weekday()
        day_scheduled = [h for h in habits if day_weekday in (h.applicable_days or [])]
        if not day_scheduled:
            continue
        day_sum = 0.0
        for h in day_scheduled:
            entry = prev_map.get((h.id, d))
            _, score, _ = evaluate_habit_status(h, entry)
            day_sum += score
        prev_total_score += (day_sum / len(day_scheduled))
    prev_week_score = round(prev_total_score / 7.0, 1) if prev_days_list else None

    score_change = round(overall_week_score - prev_week_score, 1) if prev_week_score is not None else None

    # Compute per-habit metrics
    for habit in habits:
        scheduled_days = [d for d in days_list if d.weekday() in (habit.applicable_days or [])]
        scheduled_count = len(scheduled_days)

        trend_data = []
        total_qty = 0.0
        min_achieved_count = 0
        target_achieved_count = 0
        best_day_name = None
        best_val = 0.0

        for d in days_list:
            entry = target_map.get((habit.id, d))
            status, score, val = evaluate_habit_status(habit, entry)
            trend_data.append({
                "date": str(d),
                "day": d.strftime("%a"),
                "value": val,
                "status": status
            })

            total_qty += val
            if val > best_val:
                best_val = val
                best_day_name = d.strftime("%A")

            if status in ["Completed", "Target Achieved", "Target Exceeded"]:
                target_achieved_count += 1
                min_achieved_count += 1
            elif status == "Minimum Achieved":
                min_achieved_count += 1

        prev_total_qty = sum(
            prev_map.get((habit.id, d)).actual_value or 0.0 
            for d in prev_days_list 
            if prev_map.get((habit.id, d)) and prev_map.get((habit.id, d)).actual_value
        ) if habit.tracking_type != TrackingType.BINARY else sum(
            1.0 for d in prev_days_list if prev_map.get((habit.id, d)) and prev_map.get((habit.id, d)).binary_completed
        )

        pct_change = None
        if prev_total_qty > 0:
            pct_change = round(((total_qty - prev_total_qty) / prev_total_qty) * 100.0, 1)

        daily_avg = round(total_qty / 7.0, 1)
        min_rate = round((min_achieved_count / max(1, scheduled_count)) * 100.0, 1)
        target_rate = round((target_achieved_count / max(1, scheduled_count)) * 100.0, 1)

        # Simple consecutive streak calculation as secondary info
        streak = 0
        check_date = today
        while True:
            e = target_map.get((habit.id, check_date)) or prev_map.get((habit.id, check_date))
            if not e:
                break
            st, _, _ = evaluate_habit_status(habit, e)
            if st in ["Completed", "Target Achieved", "Target Exceeded", "Minimum Achieved"]:
                streak += 1
                check_date = check_date - timedelta(days=1)
            else:
                break
            if streak > 30:
                break

        habit_metrics.append(
            HabitWeeklyMetric(
                habit_id=habit.id,
                habit_name=habit.name,
                category_name=habit.category.name if habit.category else None,
                tracking_type=habit.tracking_type,
                unit=habit.unit,
                target_value=habit.target_value,
                minimum_value=habit.minimum_value,
                total_quantity=total_qty,
                daily_average=daily_avg,
                minimum_completion_rate=min_rate,
                target_completion_rate=target_rate,
                best_day=best_day_name,
                best_day_value=best_val,
                trend_data=trend_data,
                previous_week_total=prev_total_qty,
                percentage_change=pct_change,
                streak=streak
            )
        )

    return WeeklyAnalyticsResponse(
        start_date=target_monday,
        end_date=target_sunday,
        week_number=target_monday.isocalendar()[1],
        overall_execution_score=overall_week_score,
        prev_week_execution_score=prev_week_score,
        score_change_pct=score_change,
        daily_scores=daily_scores,
        habit_metrics=habit_metrics
    )


@router.get("/review", response_model=WeeklyReviewResponse)
def get_weekly_review(
    week_offset: int = Query(0),
    db: Session = Depends(get_db)
):
    analytics = get_weekly_analytics(week_offset=week_offset, db=db)
    metrics_dict = [m.model_dump() for m in analytics.habit_metrics]

    diagnosis = generate_weekly_review_diagnosis(
        metrics=metrics_dict,
        overall_current_score=analytics.overall_execution_score,
        overall_prev_score=analytics.prev_week_execution_score
    )

    return WeeklyReviewResponse(
        start_date=analytics.start_date,
        end_date=analytics.end_date,
        **diagnosis
    )
