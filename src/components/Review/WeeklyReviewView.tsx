import React, { useState, useEffect } from "react";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Compass,
  ChevronLeft,
  ChevronRight,
  PackageCheck
} from "lucide-react";
import { WeeklyReview } from "../../types";
import { api } from "../../services/api";

export const WeeklyReviewView: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReview = async (offset: number) => {
    setLoading(true);
    try {
      const data = await api.getWeeklyReview(offset);
      setReview(data);
    } catch (err) {
      console.error("Failed to load weekly review", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview(weekOffset);
  }, [weekOffset]);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
        <div className="inline-block animate-spin w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full mb-3" />
        <p className="text-xs text-slate-500 font-medium">Synthesizing diagnostic weekly review...</p>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Diagnostic Execution Review
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Week of {review.start_date} – {review.end_date}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {review.week_comparison_note}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Week</span>
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>Next Week</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Diagnostic Insight Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
              Objective System Diagnosis
            </h4>
            <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed font-medium">
              {review.diagnostic_insight}
            </p>
          </div>
        </div>
      </div>

      {/* Total Measurable Output Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <PackageCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Total Measurable Output Secured
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-num">
            Controllable Volume
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {review.total_measurable_summary.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-xs font-medium text-slate-500 block truncate">
                {item.habit_name}
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-mono-num font-extrabold text-slate-900">
                  {item.total}
                </span>
                <span className="text-xs font-mono-num text-slate-500">
                  {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2x2 Matrix: Consistent vs Missed & Minimums vs Full Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consistent Areas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Areas Executed Consistently
            </h4>
          </div>
          <ul className="space-y-2">
            {review.consistent_areas.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Frequently Missed Areas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Frequently Missed Areas (Examine Friction)
            </h4>
          </div>
          <ul className="space-y-2">
            {review.frequently_missed_areas.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Minimums Consistently Achieved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Minimums Consistently Achieved
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            Minimum floor was successfully protected, sustaining daily momentum:
          </p>
          <ul className="space-y-2">
            {review.minimums_consistently_achieved.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Full Targets Achieved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Full Targets Consistently Achieved
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            High-standard full target reached reliably across the week:
          </p>
          <ul className="space-y-2">
            {review.full_targets_consistently_achieved.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Week-over-Week Changes (Improved vs Declined) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
            <h4 className="text-sm font-bold text-slate-900">What Improved vs Prior Week</h4>
          </div>
          <ul className="space-y-2">
            {review.improved_areas.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3 text-slate-600">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900">What Adjusted / Declined</h4>
          </div>
          <ul className="space-y-2">
            {review.declined_areas.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-700 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
