import React, { useState, useEffect } from "react";
import { BookOpen, Check, Save } from "lucide-react";
import { DailyReflection } from "../../types";
import { api } from "../../services/api";

interface DailyReflectionCardProps {
  reflection: DailyReflection | null;
  currentDate: string;
  onRefresh: () => void;
}

export const DailyReflectionCard: React.FC<DailyReflectionCardProps> = ({
  reflection,
  currentDate,
  onRefresh,
}) => {
  const [wentWell, setWentWell] = useState("");
  const [interfered, setInterfered] = useState("");
  const [toAdjust, setToAdjust] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (reflection) {
      setWentWell(reflection.what_went_well || "");
      setInterfered(reflection.what_interfered || "");
      setToAdjust(reflection.what_to_adjust || "");
    } else {
      setWentWell("");
      setInterfered("");
      setToAdjust("");
    }
  }, [reflection, currentDate]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.saveReflection({
        reflection_date: currentDate,
        what_went_well: wentWell.trim(),
        what_interfered: interfered.trim(),
        what_to_adjust: toAdjust.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error("Failed to save reflection", err);
      alert("Failed to save reflection");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mt-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Daily Reflection
            </h3>
            <p className="text-xs text-slate-500">
              Study the trend and diagnose friction points to improve the system tomorrow
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            saveSuccess
              ? "bg-emerald-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Reflection"}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Prompt 1 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            1. What went well today?
          </label>
          <textarea
            rows={3}
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            placeholder="Highlight controllable actions executed effectively..."
            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-slate-50/40"
          />
        </div>

        {/* Prompt 2 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            2. What interfered with execution?
          </label>
          <textarea
            rows={3}
            value={interfered}
            onChange={(e) => setInterfered(e.target.value)}
            placeholder="Identify context-switching, energy dips, scheduling conflicts..."
            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-slate-50/40"
          />
        </div>

        {/* Prompt 3 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            3. What will I adjust tomorrow?
          </label>
          <textarea
            rows={3}
            value={toAdjust}
            onChange={(e) => setToAdjust(e.target.value)}
            placeholder="Controllable adjustment (e.g., time-block morning, set phone in other room)..."
            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-slate-50/40"
          />
        </div>
      </div>
    </div>
  );
};
