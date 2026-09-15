"""
Daily Signals - Pydantic Schemas for Validation and API Serialization
"""
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from models import TrackingType


# ------------------ CATEGORY SCHEMAS ------------------
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    color: Optional[str] = "#3b82f6"
    display_order: Optional[int] = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    display_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ------------------ HABIT SCHEMAS ------------------
class HabitBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    category_id: Optional[int] = None
    tracking_type: TrackingType = TrackingType.BINARY
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    target_value: Optional[float] = None
    applicable_days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    is_active: bool = True
    display_order: Optional[int] = 0


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    tracking_type: Optional[TrackingType] = None
    unit: Optional[str] = None
    minimum_value: Optional[float] = None
    target_value: Optional[float] = None
    applicable_days: Optional[List[int]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class HabitResponse(HabitBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ------------------ HABIT ENTRY SCHEMAS ------------------
class HabitEntryBase(BaseModel):
    habit_id: int
    entry_date: date
    actual_value: Optional[float] = 0.0
    binary_completed: Optional[bool] = False
    notes: Optional[str] = None


class HabitEntryCreate(HabitEntryBase):
    pass


class HabitEntryResponse(HabitEntryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ------------------ DAILY SIGNAL SCHEMAS ------------------
class DailySignalBase(BaseModel):
    signal_date: date
    order_position: int = Field(..., ge=1, le=3)
    title: str = Field(..., max_length=200)
    category_name: Optional[str] = None
    description: Optional[str] = None
    target_quantity: Optional[str] = None
    is_completed: bool = False


class DailySignalCreate(DailySignalBase):
    pass


class DailySignalUpdate(BaseModel):
    title: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    target_quantity: Optional[str] = None
    is_completed: Optional[bool] = None


class DailySignalResponse(DailySignalBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ------------------ DAILY REFLECTION SCHEMAS ------------------
class DailyReflectionBase(BaseModel):
    reflection_date: date
    what_went_well: Optional[str] = None
    what_interfered: Optional[str] = None
    what_to_adjust: Optional[str] = None


class DailyReflectionCreate(DailyReflectionBase):
    pass


class DailyReflectionResponse(DailyReflectionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ------------------ DASHBOARD & EXECUTION STATUS SCHEMAS ------------------
class HabitWithExecution(BaseModel):
    habit: HabitResponse
    entry: Optional[HabitEntryResponse] = None
    status: str  # Not Started, Below Minimum, Minimum Achieved, Target Achieved, Target Exceeded, Completed, Not Completed
    is_scheduled_today: bool
    actual_value: float = 0.0
    binary_completed: bool = False
    execution_score_points: float = 0.0  # 0 to 100 for this habit


class TodayDashboardResponse(BaseModel):
    date: date
    day_name: str
    execution_score: float                # 0 to 100%
    habits_scheduled_count: int
    habits_completed_count: int
    habits_remaining_count: int
    minimum_achieved_count: int
    full_target_achieved_count: int
    minimum_progress_pct: float
    full_target_progress_pct: float
    
    signals: List[DailySignalResponse]
    habits: List[HabitWithExecution]
    reflection: Optional[DailyReflectionResponse] = None


# ------------------ ANALYTICS & REVIEW SCHEMAS ------------------
class HabitWeeklyMetric(BaseModel):
    habit_id: int
    habit_name: str
    category_name: Optional[str]
    tracking_type: TrackingType
    unit: Optional[str]
    target_value: Optional[float]
    minimum_value: Optional[float]
    total_quantity: float
    daily_average: float
    minimum_completion_rate: float
    target_completion_rate: float
    best_day: Optional[str]
    best_day_value: float
    trend_data: List[Dict[str, Any]]  # [{'date': '2026-09-08', 'day': 'Tue', 'value': 65, 'status': '...'}]
    previous_week_total: Optional[float] = None
    percentage_change: Optional[float] = None
    streak: int = 0


class WeeklyAnalyticsResponse(BaseModel):
    start_date: date
    end_date: date
    week_number: int
    overall_execution_score: float
    prev_week_execution_score: Optional[float]
    score_change_pct: Optional[float]
    daily_scores: List[Dict[str, Any]]
    habit_metrics: List[HabitWeeklyMetric]


class WeeklyReviewResponse(BaseModel):
    start_date: date
    end_date: date
    consistent_areas: List[str]
    frequently_missed_areas: List[str]
    minimums_consistently_achieved: List[str]
    full_targets_consistently_achieved: List[str]
    improved_areas: List[str]
    declined_areas: List[str]
    total_measurable_summary: List[Dict[str, Any]]
    week_comparison_note: str
    diagnostic_insight: str
