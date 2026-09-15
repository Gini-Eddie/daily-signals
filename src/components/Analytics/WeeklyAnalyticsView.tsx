import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  ShieldCheck, 
  Target, 
  ChevronLeft, 
  ChevronRight,
  Zap
} from "lucide-react";
import { WeeklyAnalytics } from "../../types";
import { api } from "../../services/api";

export const WeeklyAnalyticsView: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAnalytics = async (offset: number) => {
    setLoading(true);
    try {
      const data = await api.getWeeklyAnalytics(offset);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load weekly analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(weekOffset);
  }, [weekOffset]);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
        <div className="inline-block animate-spin w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full mb-3" />
        <p className="text-xs text-slate-500 font-medium">Computing weekly execution metrics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Week Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Analytics Period
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Week of {analytics.start_date} – {analytics.end_date}</span>
            {weekOffset === 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Current Week
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Week</span>
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Current
            </button>
          )}
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>Next Week</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 3 High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Weekly Execution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Weekly Execution Average</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-mono-num font-extrabold text-slate-900">
              {analytics.overall_execution_score}%
            </span>
            {analytics.score_change_pct !== null && (
              <span
                className={`text-xs font-bold font-mono-num flex items-center ${
                  analytics.score_change_pct >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {analytics.score_change_pct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                )}
                {analytics.score_change_pct >= 0 ? `+${analytics.score_change_pct}%` : `${analytics.score_change_pct}%`} vs prior
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated strictly across scheduled controllable daily actions
          </p>
        </div>

        {/* Prior Week Baseline Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Previous Week Baseline</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-mono-num font-extrabold text-slate-700">
              {analytics.prev_week_execution_score !== null ? `${analytics.prev_week_execution_score}%` : "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics.prev_week_execution_score !== null
              ? "Historical 7-day average comparison"
              : "Baseline recording initialized"}
          </p>
        </div>

        {/* Anti-Fragile Note */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide block mb-1">
              System Principle
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              "A broken streak must not feel like the system failed. Study the trend, adjust the friction, and execute the next controllable block."
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-num mt-2">
            Daily Signals Core Philosophy
          </span>
        </div>
      </div>

      {/* Daily Trend Chart (Mon to Sun) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Execution Trend (Monday to Sunday)
            </h3>
            <p className="text-xs text-slate-500">
              Day-by-day score progression across this week's scheduled habits
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.daily_scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, "Execution Score"]}
                labelFormatter={(label) => `Day: ${label}`}
                contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="score" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Habit Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quantitative Habit Metrics & Output Patterns
            </h3>
            <p className="text-xs text-slate-500">
              Output totals, daily averages, floor achievement rates, and full target rates
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-3">Habit & Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 font-mono-num">Weekly Total</th>
                <th className="px-4 py-3 font-mono-num">Daily Avg</th>
                <th className="px-4 py-3">Min Floor Rate</th>
                <th className="px-4 py-3">Target Rate</th>
                <th className="px-4 py-3">Best Day</th>
                <th className="px-4 py-3">vs Prior Week</th>
                <th className="px-4 py-3">Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.habit_metrics.map((m) => (
                <tr key={m.habit_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="font-bold text-xs">{m.habit_name}</div>
                    <div className="text-[10px] text-slate-400">{m.category_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono-num font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {m.tracking_type === "MINIMUM_TARGET" ? "Min+Target" : m.tracking_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono-num font-bold text-slate-900">
                    {m.tracking_type === "BINARY" ? (
                      `${m.total_quantity} days`
                    ) : (
                      `${m.total_quantity} ${m.unit || ""}`
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono-num text-slate-600">
                    {m.daily_average} {m.unit || "/day"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5 font-mono-num">
                      <span className="font-semibold text-blue-700">{m.minimum_completion_rate}%</span>
                      <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${m.minimum_completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5 font-mono-num">
                      <span className="font-semibold text-purple-700">{m.target_completion_rate}%</span>
                      <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${m.target_completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="font-medium text-slate-800">{m.best_day}</span>
                    {m.best_day_value > 0 && m.tracking_type !== "BINARY" && (
                      <span className="text-[10px] text-slate-400 font-mono-num block">
                        ({m.best_day_value} {m.unit})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono-num">
                    {m.percentage_change !== null ? (
                      <span
                        className={`font-semibold ${
                          m.percentage_change >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {m.percentage_change >= 0 ? `+${m.percentage_change}%` : `${m.percentage_change}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 font-mono-num">
                    {m.streak}d active
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
