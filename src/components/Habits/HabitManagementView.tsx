import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Info, 
  ShieldAlert, 
  X, 
  Check, 
  Sparkles,
  Layers
} from "lucide-react";
import { Habit, Category, TrackingType } from "../../types";
import { api } from "../../services/api";

const DAYS_OF_WEEK = [
  { day: 0, label: "Mon" },
  { day: 1, label: "Tue" },
  { day: 2, label: "Wed" },
  { day: 3, label: "Thu" },
  { day: 4, label: "Fri" },
  { day: 5, label: "Sat" },
  { day: 6, label: "Sun" },
];

export const HabitManagementView: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<number | undefined>(undefined);
  const [formTrackingType, setFormTrackingType] = useState<TrackingType>("BINARY");
  const [formUnit, setFormUnit] = useState("");
  const [formMinimumValue, setFormMinimumValue] = useState<string>("");
  const [formTargetValue, setFormTargetValue] = useState<string>("");
  const [formDays, setFormDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hList, cList] = await Promise.all([
        api.getHabits(includeArchived),
        api.getCategories(),
      ]);
      setHabits(hList);
      setCategories(cList);
    } catch (err) {
      console.error("Failed to load habits/categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [includeArchived]);

  const openCreateModal = () => {
    setEditingHabit(null);
    setFormName("");
    setFormDesc("");
    setFormCategoryId(categories[0]?.id);
    setFormTrackingType("MINIMUM_TARGET");
    setFormUnit("minutes");
    setFormMinimumValue("15");
    setFormTargetValue("45");
    setFormDays([0, 1, 2, 3, 4, 5, 6]);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (h: Habit) => {
    setEditingHabit(h);
    setFormName(h.name);
    setFormDesc(h.description || "");
    setFormCategoryId(h.category_id || undefined);
    setFormTrackingType(h.tracking_type);
    setFormUnit(h.unit || "");
    setFormMinimumValue(h.minimum_value ? String(h.minimum_value) : "");
    setFormTargetValue(h.target_value ? String(h.target_value) : "");
    setFormDays(h.applicable_days || [0, 1, 2, 3, 4, 5, 6]);
    setFormIsActive(h.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleDay = (day: number) => {
    if (formDays.includes(day)) {
      if (formDays.length === 1) return; // Keep at least 1 day
      setFormDays(formDays.filter((d) => d !== day));
    } else {
      setFormDays([...formDays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Rule: Distinguish execution from outcomes
    const lower = formName.toLowerCase();
    if (
      lower.includes("save ₦") ||
      lower.includes("save $") ||
      lower.includes("bank balance") ||
      lower.includes("rent available") ||
      lower.includes("reach ₦")
    ) {
      setFormError(
        "Execution Rule: Daily Signals measures controllable actions (e.g. prospect calls, deep work blocks), not passive outcome targets like saving money or bank balances."
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Habit> = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        category_id: formCategoryId ? Number(formCategoryId) : null,
        tracking_type: formTrackingType,
        unit: formTrackingType === "BINARY" ? null : formUnit.trim() || null,
        minimum_value:
          formTrackingType === "MINIMUM_TARGET" && formMinimumValue
            ? parseFloat(formMinimumValue)
            : null,
        target_value:
          formTrackingType !== "BINARY" && formTargetValue
            ? parseFloat(formTargetValue)
            : null,
        applicable_days: formDays,
        is_active: formIsActive,
      };

      if (editingHabit) {
        await api.updateHabit(editingHabit.id, payload);
      } else {
        await api.createHabit(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to save habit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleArchive = async (habit: Habit) => {
    try {
      await api.updateHabit(habit.id, { is_active: !habit.is_active });
      loadData();
    } catch (err) {
      console.error("Failed to toggle archive", err);
    }
  };

  const handleDelete = async (habitId: number) => {
    if (!confirm("Are you sure you want to permanently delete this habit and all its history?")) return;
    try {
      await api.deleteHabit(habitId);
      loadData();
    } catch (err) {
      console.error("Failed to delete habit", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Educational Banner: Controllable Actions vs Passive Outcomes */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
              Core Discipline: Controllable Actions vs. Outcomes
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Daily Signals isolates <strong>leading execution indicators</strong> from outcome results.
              Do not treat passive outcomes like <em>"Have ₦500,000 for rent"</em> or <em>"Save $1,000"</em> as daily habits.
              Instead, measure the direct actions that build momentum:
              <span className="text-slate-100 font-semibold"> Prospect calls, pipeline follow-ups, AI engineering blocks, and physical workouts.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Configured Daily Habits ({habits.length})
          </h2>
          <p className="text-xs text-slate-500">
            Define tracking types, floor minimums, targets, and scheduled days
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Show Archived</span>
          </label>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Habit</span>
          </button>
        </div>
      </div>

      {/* Habit List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">
            Loading configured habits...
          </div>
        ) : habits.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">
            No habits found. Click "Create New Habit" above to add your first controllable action.
          </div>
        ) : (
          habits.map((h) => {
            const catColor = h.category?.color || "#64748b";
            return (
              <div
                key={h.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                  !h.is_active ? "bg-slate-50 opacity-60" : "hover:bg-slate-50/50"
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: catColor }}
                    />
                    <span className="text-xs font-semibold text-slate-500">
                      {h.category?.name || "Uncategorized"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-mono-num font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {h.tracking_type === "MINIMUM_TARGET"
                        ? "MINIMUM + TARGET"
                        : h.tracking_type}
                    </span>
                    {!h.is_active && (
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                        Archived
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {h.name}
                  </h3>

                  {h.description && (
                    <p className="text-xs text-slate-500 max-w-2xl">{h.description}</p>
                  )}

                  {/* Targets & Schedule */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 font-mono-num">
                    {h.tracking_type === "MINIMUM_TARGET" && (
                      <>
                        <span>Floor Min: <strong>{h.minimum_value}</strong> {h.unit}</span>
                        <span>Target: <strong>{h.target_value}</strong> {h.unit}</span>
                      </>
                    )}
                    {h.tracking_type === "QUANTITY" && (
                      <span>Target: <strong>{h.target_value}</strong> {h.unit}</span>
                    )}
                    {h.tracking_type === "BINARY" && (
                      <span className="text-slate-500">Binary Completion</span>
                    )}

                    <span className="text-slate-300">•</span>

                    {/* Active Days */}
                    <div className="flex items-center space-x-1">
                      {DAYS_OF_WEEK.map(({ day, label }) => {
                        const isScheduled = (h.applicable_days || []).includes(day);
                        return (
                          <span
                            key={day}
                            className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                              isScheduled
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => openEditModal(h)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit Habit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(h)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title={h.is_active ? "Archive Habit" : "Unarchive Habit"}
                  >
                    {h.is_active ? (
                      <Archive className="w-4 h-4" />
                    ) : (
                      <ArchiveRestore className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create / Edit Habit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingHabit ? "Edit Controllable Habit" : "Define New Controllable Habit"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Habit Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Engineering Block, Prospect Calls, Push-ups"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formCategoryId || ""}
                  onChange={(e) => setFormCategoryId(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tracking Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tracking Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["BINARY", "QUANTITY", "MINIMUM_TARGET"] as TrackingType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormTrackingType(type)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                        formTrackingType === type
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {type === "MINIMUM_TARGET"
                        ? "Min + Target"
                        : type === "QUANTITY"
                        ? "Quantity"
                        : "Binary"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numeric Details if not Binary */}
              {formTrackingType !== "BINARY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Measurement Unit
                    </label>
                    <input
                      type="text"
                      placeholder="reps, pages, minutes, calls"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Target
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 60, 45, 5"
                      value={formTargetValue}
                      onChange={(e) => setFormTargetValue(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>

                  {formTrackingType === "MINIMUM_TARGET" && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Minimum Floor Threshold
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 15 minutes, 5 pages (partial execution threshold)"
                        value={formMinimumValue}
                        onChange={(e) => setFormMinimumValue(e.target.value)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        If minimum is reached, it is counted as partial success (75%+), never failure.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Execution Guidance
                </label>
                <textarea
                  rows={2}
                  placeholder="Define specific controllable actions to take..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              {/* Applicable Days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheduled Days (unselected days won't penalize execution score)
                </label>
                <div className="flex space-x-1 sm:space-x-2">
                  {DAYS_OF_WEEK.map(({ day, label }) => {
                    const isSelected = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="habitActiveCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="habitActiveCheck" className="text-xs font-semibold text-slate-700">
                  Active habit (uncheck to archive)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : editingHabit ? "Save Changes" : "Create Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
