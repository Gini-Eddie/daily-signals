"""
Daily Signals - Core Execution Service & Business Logic

Philosophy:
"Measure execution. Study the trend. Improve the system."

Distinguish execution from outcomes:
- Only controllable daily actions contribute to execution score.
- Minimum achieved is partial success, NEVER classified as failure.
- No penalty for unscheduled habits on any given day.
"""
from datetime import date, timedelta
from typing import List, Dict, Any, Tuple, Optional
from backend.models import Habit, HabitEntry, TrackingType


def evaluate_habit_status(habit: Habit, entry: Optional[HabitEntry]) -> Tuple[str, float, float]:
    """
    Evaluates execution status and score points (0.0 to 100.0) for a habit entry.
    Returns:
        (status_string, score_points, actual_numeric_or_binary_value)
    """
    if habit.tracking_type == TrackingType.BINARY:
        is_done = bool(entry.binary_completed) if entry else False
        actual_val = 1.0 if is_done else 0.0
        if is_done:
            return "Completed", 100.0, actual_val
        return "Not Completed", 0.0, actual_val

    # Numeric tracking types
    actual = float(entry.actual_value) if (entry and entry.actual_value is not None) else 0.0

    if habit.tracking_type == TrackingType.QUANTITY:
        target = float(habit.target_value or 1.0)
        if actual <= 0.0:
            return "Not Started", 0.0, actual
        if actual < target:
            # Partial completion ratio up to 99%
            score = (actual / target) * 100.0
            return "Below Target", min(score, 99.0), actual
        if actual == target:
            return "Target Achieved", 100.0, actual
        # actual > target
        return "Target Exceeded", 100.0, actual

    if habit.tracking_type == TrackingType.MINIMUM_TARGET:
        minimum = float(habit.minimum_value or 1.0)
        target = float(habit.target_value or (minimum * 2.0))

        if actual <= 0.0:
            return "Not Started", 0.0, actual
        if actual < minimum:
            # Below minimum gets proportional credit up to 50%
            score = (actual / minimum) * 50.0
            return "Below Minimum", round(score, 1), actual
        if actual < target:
            # Minimum Achieved! Partial success: awarded 75% to 99%
            # "If the minimum is achieved but the full target is not achieved, do NOT classify the habit as a failure."
            progress_between = (actual - minimum) / max(target - minimum, 0.001)
            score = 75.0 + (progress_between * 24.0)
            return "Minimum Achieved", round(score, 1), actual
        if actual == target:
            return "Target Achieved", 100.0, actual
        # actual > target
        return "Target Exceeded", 100.0, actual

    return "Not Completed", 0.0, 0.0


def calculate_daily_execution_score(
    habits: List[Habit],
    entries_map: Dict[int, HabitEntry],
    target_date: date
) -> Dict[str, Any]:
    """
    Computes daily execution metrics.
    Only applicable habits for target_date's day of week (0=Mon, 6=Sun) are counted.
    """
    day_of_week = target_date.weekday()
    scheduled_habits = [h for h in habits if h.is_active and (day_of_week in (h.applicable_days or []))]

    if not scheduled_habits:
        return {
            "score": 0.0,
            "scheduled_count": 0,
            "completed_count": 0,
            "remaining_count": 0,
            "min_achieved_count": 0,
            "target_achieved_count": 0,
            "min_progress_pct": 0.0,
            "target_progress_pct": 0.0,
        }

    total_score = 0.0
    completed_count = 0
    min_achieved_count = 0
    target_achieved_count = 0

    for habit in scheduled_habits:
        entry = entries_map.get(habit.id)
        status, score, _ = evaluate_habit_status(habit, entry)
        total_score += score

        if status in ["Completed", "Target Achieved", "Target Exceeded"]:
            completed_count += 1
            target_achieved_count += 1
            min_achieved_count += 1
        elif status == "Minimum Achieved":
            min_achieved_count += 1
            # Minimum counts as positive execution, though target still remaining

    total_count = len(scheduled_habits)
    final_score = round(total_score / total_count, 1) if total_count > 0 else 0.0
    remaining_count = max(0, total_count - completed_count)
    min_progress_pct = round((min_achieved_count / total_count) * 100.0, 1)
    target_progress_pct = round((target_achieved_count / total_count) * 100.0, 1)

    return {
        "score": final_score,
        "scheduled_count": total_count,
        "completed_count": completed_count,
        "remaining_count": remaining_count,
        "min_achieved_count": min_achieved_count,
        "target_achieved_count": target_achieved_count,
        "min_progress_pct": min_progress_pct,
        "target_progress_pct": target_progress_pct,
    }


def generate_weekly_review_diagnosis(
    metrics: List[Dict[str, Any]],
    overall_current_score: float,
    overall_prev_score: Optional[float]
) -> Dict[str, Any]:
    """
    Generates a constructive, diagnostic weekly review.
    Focuses on controllable system diagnosis rather than guilt or judgmental language.
    """
    consistent = []
    missed = []
    min_consistent = []
    target_consistent = []
    improved = []
    declined = []
    measurable_summary = []

    for m in metrics:
        name = m.get("habit_name", "")
        min_rate = m.get("minimum_completion_rate", 0.0)
        target_rate = m.get("target_completion_rate", 0.0)
        pct_change = m.get("percentage_change")
        total_qty = m.get("total_quantity", 0.0)
        unit = m.get("unit") or ""

        if total_qty > 0:
            measurable_summary.append({
                "habit_name": name,
                "total": total_qty,
                "unit": unit
            })

        if target_rate >= 70.0:
            consistent.append(f"{name} ({target_rate:.0f}% full execution)")
            target_consistent.append(name)
        elif target_rate <= 30.0 and min_rate <= 40.0:
            missed.append(f"{name} ({target_rate:.0f}% execution)")

        if min_rate >= 80.0:
            min_consistent.append(f"{name} ({min_rate:.0f}% minimums secured)")

        if pct_change is not None:
            if pct_change >= 10.0:
                improved.append(f"{name} (+{pct_change:.0f}% volume vs prior week)")
            elif pct_change <= -10.0:
                declined.append(f"{name} ({pct_change:.0f}% vs prior week)")

    # Constructive comparative note
    if overall_prev_score is not None:
        delta = round(overall_current_score - overall_prev_score, 1)
        if delta > 0:
            comparison_note = f"Weekly execution improved by +{delta}% compared to previous week ({overall_current_score}% vs {overall_prev_score}%)."
        elif delta < 0:
            comparison_note = f"Weekly execution adjusted by {delta}% compared to previous week ({overall_current_score}% vs {overall_prev_score}%). Examine friction points."
        else:
            comparison_note = f"Weekly execution held stable at {overall_current_score}%, matching previous week."
    else:
        comparison_note = f"Initial baseline established at {overall_current_score}% average daily execution."

    # Objective diagnostic insight
    if len(min_consistent) > len(target_consistent):
        diagnostic_insight = (
            "Minimum floor targets are working effectively to preserve daily momentum on busy days. "
            "Consider whether high target thresholds need calendar time-blocking or if current friction is purely scheduling."
        )
    elif len(missed) > 2:
        diagnostic_insight = (
            "Execution variance detected across multiple categories. "
            "To restore consistency, consider reducing habit targets to non-negotiable minimums for 5 consecutive days before expanding."
        )
    else:
        diagnostic_insight = (
            "System execution is stable and controllable actions are tracking reliably across core priorities. "
            "Maintain cadence and monitor energy allocation."
        )

    return {
        "consistent_areas": consistent or ["Baseline steady across schedule"],
        "frequently_missed_areas": missed or ["No persistent failure points observed this week"],
        "minimums_consistently_achieved": min_consistent or ["Minimums tracking to schedule"],
        "full_targets_consistently_achieved": target_consistent or ["Consistent target attainment ongoing"],
        "improved_areas": improved or ["Output pacing maintained"],
        "declined_areas": declined or ["No significant downward drops observed"],
        "total_measurable_summary": measurable_summary,
        "week_comparison_note": comparison_note,
        "diagnostic_insight": diagnostic_insight,
    }
