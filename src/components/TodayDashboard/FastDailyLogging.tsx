import React, { useState } from "react";
import { 
  Check, 
  Minus, 
  Plus, 
  MessageSquare, 
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { HabitWithExecution, TrackingType } from "../../types";
import { api } from "../../services/api";

interface FastDailyLoggingProps {
  habits: HabitWithExecution[];
  currentDate: string;
  onRefresh: () => void;
}

export const FastDailyLogging: React.FC<FastDailyLoggingProps> = ({
  habits,
  currentDate,
  onRefresh,
}) => {
  const [activeNoteHabitId, setActiveNoteHabitId] = useState<number | null>(null);
  const [notesState, setNotesState] = useState<Record<number, string>>({});
  const [savingHabitId, setSavingHabitId] = useState<number | null>(null);

  // Group habits by category
  const categoriesMap = new Map<string, { id: number; color: string; habits: HabitWithExecution[] }>();

  habits.forEach((hwe) => {
    const catName = hwe.habit.category?.name || "Uncategorized";
    const catColor = hwe.habit.category?.color || "#64748b";
    const catId = hwe.habit.category?.id || 0;

    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, { id: catId, color: catColor, habits: [] });
    }
    categoriesMap.get(catName)!.habits.push(hwe);
  });

  const categoryGroups = Array.from(categoriesMap.entries());

  // Fast logging handlers
  const handleBinaryToggle = async (hwe: HabitWithExecution) => {
    const newStatus = !hwe.binary_completed;
    setSavingHabitId(hwe.habit.id);
    try {
      await api.logHabitEntry({
        habit_id: hwe.habit.id,
        entry_date: currentDate,
        binary_completed: newStatus,
        actual_value: newStatus ? 1 : 0,
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to log binary habit", err);
    } finally {
      setSavingHabitId(null);
    }
  };

  const handleAdjustQuantity = async (hwe: HabitWithExecution, delta: number) => {
    const currentVal = hwe.actual_value || 0;
    const newVal = Math.max(0, currentVal + delta);
    setSavingHabitId(hwe.habit.id);
    try {
      await api.logHabitEntry({
        habit_id: hwe.habit.id,
        entry_date: currentDate,
        actual_value: newVal,
        binary_completed: newVal > 0,
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to adjust quantity", err);
    } finally {
      setSavingHabitId(null);
    }
  };

  const handleDirectNumericInput = async (hwe: HabitWithExecution, rawValue: string) => {
    const num = parseFloat(rawValue);
    const validVal = isNaN(num) ? 0 : Math.max(0, num);
    setSavingHabitId(hwe.habit.id);
    try {
      await api.logHabitEntry({
        habit_id: hwe.habit.id,
        entry_date: currentDate,
        actual_value: validVal,
        binary_completed: validVal > 0,
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to save direct numeric input", err);
    } finally {
      setSavingHabitId(null);
    }
  };

  const handleSaveNote = async (hwe: HabitWithExecution) => {
    const noteText = notesState[hwe.habit.id] ?? (hwe.entry?.notes || "");
    try {
      await api.logHabitEntry({
        habit_id: hwe.habit.id,
        entry_date: currentDate,
        actual_value: hwe.actual_value,
        binary_completed: hwe.binary_completed,
        notes: noteText,
      });
      setActiveNoteHabitId(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to save note", err);
    }
  };

  // Status Badge Rendering with semantic styling
  const renderStatusBadge = (status: string, isScheduled: boolean) => {
    if (!isScheduled) {
      return (
        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Unscheduled Today
        </span>
      );
    }

    switch (status) {
      case "Completed":
      case "Target Achieved":
        return (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Target Achieved
          </span>
        );
      case "Target Exceeded":
        return (
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Target Exceeded
          </span>
        );
      case "Minimum Achieved":
        return (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Minimum Achieved
          </span>
        );
      case "Below Minimum":
      case "Below Target":
        return (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            In Progress
          </span>
        );
      case "Not Started":
      case "Not Completed":
      default:
        return (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Groups */}
      {categoryGroups.map(([categoryName, { color, habits: catHabits }]) => (
        <div
          key={categoryName}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
        >
          {/* Category Header */}
          <div className="bg-slate-50/80 px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase">
                {categoryName}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                ({catHabits.length} {catHabits.length === 1 ? "habit" : "habits"})
              </span>
            </div>
          </div>

          {/* Habit Rows */}
          <div className="divide-y divide-slate-100">
            {catHabits.map((hwe) => {
              const { habit, entry, status, is_scheduled_today, actual_value, binary_completed } = hwe;
              const hasNote = Boolean(entry?.notes || notesState[habit.id]);
              const isNoteOpen = activeNoteHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    !is_scheduled_today
                      ? "bg-slate-50/40 opacity-80"
                      : status === "Target Achieved" || status === "Target Exceeded" || status === "Completed"
                      ? "bg-emerald-50/15"
                      : status === "Minimum Achieved"
                      ? "bg-blue-50/15"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left: Habit Info & Targets */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {habit.name}
                        </span>
                        {renderStatusBadge(status, is_scheduled_today)}
                      </div>

                      {habit.description && (
                        <p className="text-xs text-slate-500 mb-1 line-clamp-1">
                          {habit.description}
                        </p>
                      )}

                      {/* Threshold info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono-num">
                        {habit.tracking_type === "BINARY" ? (
                          <span className="text-slate-400 text-[11px]">Binary Check</span>
                        ) : habit.tracking_type === "MINIMUM_TARGET" ? (
                          <>
                            <span>
                              Floor Min: <strong className="text-slate-700">{habit.minimum_value}</strong> {habit.unit}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>
                              Target: <strong className="text-slate-700">{habit.target_value}</strong> {habit.unit}
                            </span>
                          </>
                        ) : (
                          <span>
                            Target: <strong className="text-slate-700">{habit.target_value}</strong> {habit.unit}
                          </span>
                        )}

                        {/* Note toggle */}
                        <button
                          onClick={() => setActiveNoteHabitId(isNoteOpen ? null : habit.id)}
                          className={`inline-flex items-center space-x-1 text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                            hasNote
                              ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{hasNote ? "View Note" : "Add Note"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right: Interactive Logging Controls */}
                    <div className="flex items-center space-x-2 sm:space-x-3 self-end md:self-auto shrink-0">
                      {habit.tracking_type === "BINARY" ? (
                        /* Binary Check Toggle Button */
                        <button
                          onClick={() => handleBinaryToggle(hwe)}
                          disabled={savingHabitId === habit.id}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
                            binary_completed
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              binary_completed
                                ? "bg-white border-white text-emerald-700"
                                : "border-slate-400"
                            }`}
                          >
                            {binary_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span>{binary_completed ? "Completed" : "Mark Done"}</span>
                        </button>
                      ) : (
                        /* Quantitative Logging Controls */
                        <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                          {/* Decrement Button */}
                          <button
                            onClick={() => handleAdjustQuantity(hwe, -1)}
                            disabled={actual_value <= 0 || savingHabitId === habit.id}
                            className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Decrement by 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Input Field */}
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="any"
                              value={actual_value === 0 ? "" : actual_value}
                              placeholder="0"
                              onChange={(e) => handleDirectNumericInput(hwe, e.target.value)}
                              className="w-14 sm:w-16 text-center text-xs sm:text-sm font-bold font-mono-num text-slate-900 bg-white border border-slate-300 rounded py-1 px-1 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                            />
                            {habit.unit && (
                              <span className="text-[11px] text-slate-500 font-mono-num ml-1 hidden sm:inline">
                                {habit.unit}
                              </span>
                            )}
                          </div>

                          {/* Quick Increment Buttons */}
                          <button
                            onClick={() => handleAdjustQuantity(hwe, 1)}
                            disabled={savingHabitId === habit.id}
                            className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            title="Increment by 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Step Increments for larger quantities */}
                          {(habit.target_value || 0) >= 15 && (
                            <button
                              onClick={() => handleAdjustQuantity(hwe, 5)}
                              disabled={savingHabitId === habit.id}
                              className="px-1.5 py-1 text-[11px] font-mono-num font-bold rounded bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                              title="Add +5"
                            >
                              +5
                            </button>
                          )}
                          {(habit.target_value || 0) >= 30 && (
                            <button
                              onClick={() => handleAdjustQuantity(hwe, 15)}
                              disabled={savingHabitId === habit.id}
                              className="px-1.5 py-1 text-[11px] font-mono-num font-bold rounded bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                              title="Add +15"
                            >
                              +15
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Note Row */}
                  {isNoteOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input
                        type="text"
                        placeholder="Log execution note, context, or observation..."
                        value={notesState[habit.id] ?? (entry?.notes || "")}
                        onChange={(e) =>
                          setNotesState({ ...notesState, [habit.id]: e.target.value })
                        }
                        className="flex-1 text-xs border border-slate-300 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveNote(hwe)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs cursor-pointer"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => setActiveNoteHabitId(null)}
                          className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Read-only note preview when closed */}
                  {!isNoteOpen && entry?.notes && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 italic flex items-center space-x-1.5">
                      <span className="font-semibold not-italic text-slate-400">Note:</span>
                      <span>{entry.notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
