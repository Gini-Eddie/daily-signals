import React, { useState } from "react";
import { 
  Check, 
  Plus, 
  Edit2, 
  Trash2, 
  Flame, 
  Sparkles,
  X,
  CheckCircle2
} from "lucide-react";
import { DailySignal } from "../../types";
import { api } from "../../services/api";

interface SignalsSectionProps {
  signals: DailySignal[];
  currentDate: string;
  onRefresh: () => void;
}

export const SignalsSection: React.FC<SignalsSectionProps> = ({
  signals,
  currentDate,
  onRefresh,
}) => {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    id?: number;
    title: string;
    category_name: string;
    description: string;
    target_quantity: string;
  }>({
    title: "",
    category_name: "",
    description: "",
    target_quantity: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Map 3 fixed slots (1, 2, 3)
  const slot1 = signals.find((s) => s.order_position === 1);
  const slot2 = signals.find((s) => s.order_position === 2);
  const slot3 = signals.find((s) => s.order_position === 3);

  const slots = [
    { position: 1, signal: slot1 },
    { position: 2, signal: slot2 },
    { position: 3, signal: slot3 },
  ];

  const handleOpenEdit = (position: number, existing?: DailySignal) => {
    setEditingSlot(position);
    if (existing) {
      setFormData({
        id: existing.id,
        title: existing.title,
        category_name: existing.category_name || "",
        description: existing.description || "",
        target_quantity: existing.target_quantity || "",
      });
    } else {
      setFormData({
        title: "",
        category_name: "",
        description: "",
        target_quantity: "",
      });
    }
  };

  const handleToggleComplete = async (signal: DailySignal) => {
    try {
      await api.updateSignal(signal.id, { is_completed: !signal.is_completed });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle signal", err);
    }
  };

  const handleDelete = async (signalId: number) => {
    if (!confirm("Remove this priority signal?")) return;
    try {
      await api.deleteSignal(signalId);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete signal", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || editingSlot === null) return;

    setIsSaving(true);
    try {
      if (formData.id) {
        await api.updateSignal(formData.id, {
          title: formData.title.trim(),
          category_name: formData.category_name.trim() || null,
          description: formData.description.trim() || null,
          target_quantity: formData.target_quantity.trim() || null,
        });
      } else {
        await api.saveSignal({
          signal_date: currentDate,
          order_position: editingSlot,
          title: formData.title.trim(),
          category_name: formData.category_name.trim() || null,
          description: formData.description.trim() || null,
          target_quantity: formData.target_quantity.trim() || null,
          is_completed: false,
        });
      }
      setEditingSlot(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to save signal", err);
      alert("Failed to save signal");
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = signals.filter((s) => s.is_completed).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Today's 3 Signals</span>
              <span className="text-xs font-mono-num font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {completedCount}/3 Secured
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              The three most critical controllable daily actions for today
            </p>
          </div>
        </div>
      </div>

      {/* 3 Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
        {slots.map(({ position, signal }) => {
          if (!signal) {
            return (
              <button
                key={position}
                onClick={() => handleOpenEdit(position)}
                className="group border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-600 mb-2 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Set Signal #{position}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Define high-priority controllable action
                </span>
              </button>
            );
          }

          return (
            <div
              key={position}
              className={`relative border rounded-lg p-4 transition-all flex flex-col justify-between min-h-[140px] ${
                signal.is_completed
                  ? "bg-slate-50/80 border-slate-200"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div>
                {/* Header row with position tag & actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono-num font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{position}
                    </span>
                    {signal.category_name && (
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200">
                        {signal.category_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(position, signal)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                      title="Edit Signal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(signal.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100"
                      title="Delete Signal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4
                  className={`text-sm font-bold tracking-tight mb-1 ${
                    signal.is_completed
                      ? "line-through text-slate-400"
                      : "text-slate-900"
                  }`}
                >
                  {signal.title}
                </h4>

                {/* Description */}
                {signal.description && (
                  <p
                    className={`text-xs mb-2 line-clamp-2 ${
                      signal.is_completed ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {signal.description}
                  </p>
                )}
              </div>

              {/* Bottom Target & Completion Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                {signal.target_quantity ? (
                  <span className="text-[11px] font-mono-num text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {signal.target_quantity}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Action</span>
                )}

                <button
                  onClick={() => handleToggleComplete(signal)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    signal.is_completed
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
                  }`}
                >
                  {signal.is_completed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Executed</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Mark Done</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Signal Edit / Create Modal */}
      {editingSlot !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-base font-bold text-slate-900">
                {formData.id ? `Edit Signal #${editingSlot}` : `Define Priority Signal #${editingSlot}`}
              </h4>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design forecasting pipeline"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI Engineering, Opportunity"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Optional Target / Qty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 applications, 5 calls"
                    value={formData.target_quantity}
                    onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Execution Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of the controllable action to take..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Signal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
