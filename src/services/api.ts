import {
  Category,
  Habit,
  HabitEntry,
  DailySignal,
  DailyReflection,
  TodayDashboard,
  WeeklyAnalytics,
  WeeklyReview,
  UserProfile,
  DayPublication,
} from "../types";

const API_BASE = "/api";

export const api = {
  // User Profile & Mini-Authentication
  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`);
    if (!res.ok) throw new Error("Failed to load user profile");
    return res.json();
  },

  async saveUserProfile(payload: { name: string; role?: string; motto?: string }): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update user profile");
    return res.json();
  },

  async checkInUser(date?: string): Promise<{ name: string; checked_in_today: boolean; checkin_streak: number; message: string }> {
    const res = await fetch(`${API_BASE}/user/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (!res.ok) throw new Error("Failed to check in");
    return res.json();
  },

  // Clear Day Entries (Start Fresh / Blank)
  async clearDayEntries(date?: string): Promise<{ status: string; date: string; message: string }> {
    const res = await fetch(`${API_BASE}/entries/clear-day`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (!res.ok) throw new Error("Failed to clear entries for day");
    return res.json();
  },

  // Daily Publication & Verification
  async getPublishStatus(date?: string): Promise<{ date: string; is_published: boolean; publication: DayPublication | null }> {
    const url = date ? `${API_BASE}/publish/status?date=${date}` : `${API_BASE}/publish/status`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load publication status");
    return res.json();
  },

  async publishDay(date?: string, notes?: string): Promise<DayPublication> {
    const res = await fetch(`${API_BASE}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, notes }),
    });
    if (!res.ok) throw new Error("Failed to publish daily log");
    return res.json();
  },

  // Dashboard & History
  async getDashboard(dateStr?: string): Promise<TodayDashboard> {
    const url = dateStr ? `${API_BASE}/dashboard/today?date=${dateStr}` : `${API_BASE}/dashboard/today`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load dashboard data");
    return res.json();
  },

  async getHistory(dateStr: string): Promise<TodayDashboard> {
    const res = await fetch(`${API_BASE}/history/${dateStr}`);
    if (!res.ok) throw new Error(`Failed to load history for ${dateStr}`);
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to load categories");
    return res.json();
  },

  async createCategory(payload: { name: string; color?: string }): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create category");
    }
    return res.json();
  },

  async deleteCategory(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete category");
  },

  // Habits
  async getHabits(includeArchived = false): Promise<Habit[]> {
    const res = await fetch(`${API_BASE}/habits?include_archived=${includeArchived}`);
    if (!res.ok) throw new Error("Failed to load habits");
    return res.json();
  },

  async createHabit(habit: Partial<Habit>): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habit),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create habit");
    }
    return res.json();
  },

  async updateHabit(id: number, habit: Partial<Habit>): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habit),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update habit");
    }
    return res.json();
  },

  async deleteHabit(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/habits/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete habit");
  },

  // Fast Daily Logging (Entries)
  async logHabitEntry(payload: {
    habit_id: number;
    entry_date: string;
    actual_value?: number;
    binary_completed?: boolean;
    notes?: string | null;
  }): Promise<HabitEntry> {
    const res = await fetch(`${API_BASE}/habit-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save habit entry");
    return res.json();
  },

  // Today's 3 Signals
  async getSignals(dateStr?: string): Promise<DailySignal[]> {
    const url = dateStr ? `${API_BASE}/daily-signals?date=${dateStr}` : `${API_BASE}/daily-signals`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load daily signals");
    return res.json();
  },

  async saveSignal(payload: {
    signal_date: string;
    order_position: number;
    title: string;
    category_name?: string | null;
    description?: string | null;
    target_quantity?: string | null;
    is_completed?: boolean;
  }): Promise<DailySignal> {
    const res = await fetch(`${API_BASE}/daily-signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to save signal");
    }
    return res.json();
  },

  async updateSignal(id: number, payload: Partial<DailySignal>): Promise<DailySignal> {
    const res = await fetch(`${API_BASE}/daily-signals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update signal");
    return res.json();
  },

  async deleteSignal(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/daily-signals/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete signal");
  },

  // Daily Reflection
  async getReflection(dateStr?: string): Promise<DailyReflection | null> {
    const url = dateStr ? `${API_BASE}/reflections?date=${dateStr}` : `${API_BASE}/reflections`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load reflection");
    return res.json();
  },

  async saveReflection(payload: {
    reflection_date: string;
    what_went_well?: string;
    what_interfered?: string;
    what_to_adjust?: string;
  }): Promise<DailyReflection> {
    const res = await fetch(`${API_BASE}/reflections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save reflection");
    return res.json();
  },

  // Weekly Analytics & Review
  async getWeeklyAnalytics(weekOffset = 0): Promise<WeeklyAnalytics> {
    const res = await fetch(`${API_BASE}/analytics/weekly?week_offset=${weekOffset}`);
    if (!res.ok) throw new Error("Failed to load weekly analytics");
    return res.json();
  },

  async getWeeklyReview(weekOffset = 0): Promise<WeeklyReview> {
    const res = await fetch(`${API_BASE}/analytics/review?week_offset=${weekOffset}`);
    if (!res.ok) throw new Error("Failed to load weekly review");
    return res.json();
  },

  // System & Reset
  async resetStarterData(): Promise<void> {
    const res = await fetch(`${API_BASE}/reset-starter-data`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to reset data");
  },

  async getBackendCode(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/backend-code`);
    if (!res.ok) throw new Error("Failed to fetch backend code");
    return res.json();
  },
};
