import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Flame, 
  BookOpen,
  RotateCcw
} from "lucide-react";
import { TodayDashboard } from "../../types";
import { api } from "../../services/api";
import { FastDailyLogging } from "../TodayDashboard/FastDailyLogging";
import { DailyReflectionCard } from "../TodayDashboard/DailyReflectionCard";
import { SignalsSection } from "../TodayDashboard/SignalsSection";

export const HistoryView: React.FC = () => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const saved = sessionStorage.getItem("daily-signals-history-date");
    return saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) && saved <= getTodayStr() ? saved : getTodayStr();
  });
  const dateRef = useRef(selectedDate);
  dateRef.current = selectedDate;
  const [dashboard, setDashboard] = useState<TodayDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadHistory = async (dateStr: string, refresh = false) => {
    if (dateStr !== dateRef.current) return;
    const id = ++requestId.current;
    if (!refresh) setLoading(true);
    try {
      const data = await api.getHistory(dateStr);
      if (id !== requestId.current) return;
      setDashboard(data);
      setError(null);
    } catch (err) {
      if (id === requestId.current) setError("Could not load this day. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("daily-signals-history-date", selectedDate);
    loadHistory(selectedDate);
    return () => { requestId.current++; };
  }, [selectedDate]);

  const changeDateBy = (days: number) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const formattedDate = dashboard
    ? new Date(dashboard.date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : selectedDate;

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error} <button onClick={() => loadHistory(selectedDate)} className="underline">Retry</button></div>}
      {/* Date Navigator Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              max={getTodayStr()}
              aria-label="Date to edit"
              onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
              className="text-sm sm:text-base font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => changeDateBy(1)}
            disabled={selectedDate >= getTodayStr()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Jump to Today
          </button>

          {dashboard && (
            <div className="flex items-center space-x-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-lg font-bold">
              <span className="text-xs text-slate-300 font-medium">Daily Score:</span>
              <span className="text-sm sm:text-base font-mono-num">{dashboard.execution_score}%</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading historical record...</p>
        </div>
      ) : !dashboard || dashboard.date !== selectedDate ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <p className="text-sm text-slate-600 font-medium">No record found for {selectedDate}.</p>
        </div>
      ) : (
        <>
          {/* Historical Overview Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Historical Log
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">{formattedDate}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {dashboard.habits_completed_count} of {dashboard.habits_scheduled_count} scheduled habits completed. Backfill or edit values below.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Minimums Floor</span>
                <span className="text-sm font-bold font-mono-num text-blue-300">
                  {dashboard.minimum_progress_pct}%
                </span>
              </div>
              <div className="text-right border-l border-slate-700 pl-4">
                <span className="text-[11px] text-slate-400 block">Full Targets</span>
                <span className="text-sm font-bold font-mono-num text-purple-300">
                  {dashboard.full_target_progress_pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Historical Signals Section */}
          <SignalsSection
            key={`signals-${selectedDate}`}
            signals={dashboard.signals}
            currentDate={selectedDate}
            onRefresh={() => loadHistory(selectedDate, true)}
          />

          {/* Historical Habit Execution Log with Full Inline Editing */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Habit Execution Record ({dashboard.day_name})
              </h4>
              <span className="text-xs text-slate-500">
                Edit this day’s values, notes, and reflection below
              </span>
            </div>
            <FastDailyLogging
              key={`habits-${selectedDate}`}
              habits={dashboard.habits}
              currentDate={selectedDate}
              onRefresh={() => loadHistory(selectedDate, true)}
            />
          </div>

          {/* Historical Reflection */}
          <DailyReflectionCard
            key={`reflection-${selectedDate}`}
            reflection={dashboard.reflection}
            currentDate={selectedDate}
            onRefresh={() => loadHistory(selectedDate, true)}
          />
        </>
      )}
    </div>
  );
};
