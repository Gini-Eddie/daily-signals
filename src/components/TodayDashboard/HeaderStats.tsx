import React from "react";
import { CheckCircle2, Clock, Target, ShieldCheck } from "lucide-react";
import { TodayDashboard } from "../../types";

interface HeaderStatsProps {
  dashboard: TodayDashboard;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ dashboard }) => {
  const {
    date,
    day_name,
    execution_score,
    habits_scheduled_count,
    habits_completed_count,
    habits_remaining_count,
    minimum_achieved_count,
    full_target_achieved_count,
    minimum_progress_pct,
    full_target_progress_pct,
  } = dashboard;

  // Format date nicely: "Tuesday, September 8, 2026"
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Score tone
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-slate-700 bg-slate-100 border-slate-200";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6">
      {/* Date & Core Metric Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Current Date
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {formattedDate}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {habits_scheduled_count} controllable actions scheduled for {day_name}
          </p>
        </div>

        {/* Execution Score Gauge */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-xs text-slate-500 block font-medium">Daily Execution Score</span>
            <span className="text-[11px] text-slate-400">Scheduled Actions Only</span>
          </div>
          <div
            className={`flex items-baseline px-4 py-2 rounded-xl border font-bold ${getScoreColor(
              execution_score
            )}`}
          >
            <span className="text-2xl sm:text-3xl font-mono-num font-extrabold">{execution_score}</span>
            <span className="text-sm ml-0.5 font-semibold">%</span>
          </div>
        </div>
      </div>

      {/* 4 Execution Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {/* Completed */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-mono-num font-bold text-slate-900">
              {habits_completed_count}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {habits_scheduled_count}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  habits_scheduled_count > 0
                    ? Math.min(100, (habits_completed_count / habits_scheduled_count) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Remaining</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-mono-num font-bold text-slate-900">
              {habits_remaining_count}
            </span>
            <span className="text-xs text-slate-500 font-medium">actions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {habits_remaining_count === 0 ? "All scheduled items executed" : "Pending execution today"}
          </p>
        </div>

        {/* Minimum Achievement Progress */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Minimum Floor</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-mono-num font-bold text-slate-900">
              {minimum_achieved_count}
            </span>
            <span className="text-xs font-mono-num text-slate-500">
              ({minimum_progress_pct}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${minimum_progress_pct}%` }}
            />
          </div>
        </div>

        {/* Full Target Progress */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Full Targets</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-mono-num font-bold text-slate-900">
              {full_target_achieved_count}
            </span>
            <span className="text-xs font-mono-num text-slate-500">
              ({full_target_progress_pct}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${full_target_progress_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
