export type TrackingType = "BINARY" | "QUANTITY" | "MINIMUM_TARGET";

export interface Category {
  id: number;
  name: string;
  color: string;
  display_order?: number;
}

export interface Habit {
  id: number;
  name: string;
  description?: string | null;
  category_id?: number | null;
  category?: Category | null;
  tracking_type: TrackingType;
  unit?: string | null;
  minimum_value?: number | null;
  target_value?: number | null;
  applicable_days: number[]; // 0 = Mon, 6 = Sun
  is_active: boolean;
  display_order?: number;
  created_at?: string;
}

export interface HabitEntry {
  id: number;
  habit_id: number;
  entry_date: string; // YYYY-MM-DD
  actual_value?: number;
  binary_completed?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DailySignal {
  id: number;
  signal_date: string; // YYYY-MM-DD
  order_position: number; // 1, 2, or 3
  title: string;
  category_name?: string | null;
  description?: string | null;
  target_quantity?: string | null;
  is_completed: boolean;
  created_at?: string;
}

export interface DailyReflection {
  id?: number;
  reflection_date: string;
  what_went_well?: string;
  what_interfered?: string;
  what_to_adjust?: string;
  created_at?: string;
}

export interface UserProfile {
  name: string;
  role?: string;
  motto?: string;
  checked_in_today: boolean;
  last_checkin_date?: string;
  checkin_streak: number;
}

export interface DayPublication {
  date: string;
  day_name?: string;
  is_published: boolean;
  published_at?: string;
  published_by?: string;
  execution_score: number;
  habits_count: number;
  habits_completed: number;
  minimums_achieved: number;
  notes?: string;
  verification_status: "VERIFIED_READY" | "VERIFIED_PARTIAL" | "VERIFIED_BLANK" | "UNPUBLISHED";
}

export interface HabitWithExecution {
  habit: Habit;
  entry: HabitEntry | null;
  status: "Not Started" | "Below Minimum" | "Below Target" | "Minimum Achieved" | "Target Achieved" | "Target Exceeded" | "Completed" | "Not Completed";
  is_scheduled_today: boolean;
  actual_value: number;
  binary_completed: boolean;
  execution_score_points: number;
}

export interface TodayDashboard {
  date: string;
  day_name: string;
  execution_score: number;
  habits_scheduled_count: number;
  habits_completed_count: number;
  habits_remaining_count: number;
  minimum_achieved_count: number;
  full_target_achieved_count: number;
  minimum_progress_pct: number;
  full_target_progress_pct: number;
  signals: DailySignal[];
  habits: HabitWithExecution[];
  reflection: DailyReflection | null;
  publication?: DayPublication | null;
}

export interface TrendDataPoint {
  date: string;
  day: string;
  value: number;
  status: string;
}

export interface HabitWeeklyMetric {
  habit_id: number;
  habit_name: string;
  category_name?: string;
  tracking_type: TrackingType;
  unit?: string | null;
  target_value?: number | null;
  minimum_value?: number | null;
  total_quantity: number;
  daily_average: number;
  minimum_completion_rate: number;
  target_completion_rate: number;
  best_day: string;
  best_day_value: number;
  trend_data: TrendDataPoint[];
  previous_week_total?: number | null;
  percentage_change?: number | null;
  streak: number;
}

export interface WeeklyAnalytics {
  start_date: string;
  end_date: string;
  week_number: number;
  overall_execution_score: number;
  prev_week_execution_score?: number | null;
  score_change_pct?: number | null;
  daily_scores: { date: string; day: string; score: number }[];
  habit_metrics: HabitWeeklyMetric[];
}

export interface MeasurableSummaryItem {
  habit_name: string;
  total: number;
  unit: string;
}

export interface WeeklyReview {
  start_date: string;
  end_date: string;
  consistent_areas: string[];
  frequently_missed_areas: string[];
  minimums_consistently_achieved: string[];
  full_targets_consistently_achieved: string[];
  improved_areas: string[];
  declined_areas: string[];
  total_measurable_summary: MeasurableSummaryItem[];
  week_comparison_note: string;
  diagnostic_insight: string;
}
