import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, Send, Award, Sparkles, Dumbbell, ShieldCheck } from "lucide-react";
import { TodayDashboard, UserProfile, DayPublication } from "../../types";

interface PublishDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: TodayDashboard | null;
  profile: UserProfile | null;
  onPublish: (notes?: string) => Promise<void>;
  publication: DayPublication | null;
}

export const PublishDayModal: React.FC<PublishDayModalProps> = ({
  isOpen,
  onClose,
  dashboard,
  profile,
  onPublish,
  publication,
}) => {
  const [notes, setNotes] = useState(publication?.notes || "");
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  if (!isOpen || !dashboard) return null;

  const scheduledHabits = dashboard.habits.filter((h) => h.is_scheduled_today);
  const completedHabits = scheduledHabits.filter((h) =>
    ["Completed", "Target Achieved", "Target Exceeded"].includes(h.status)
  );
  const minimumHabits = scheduledHabits.filter((h) => h.status === "Minimum Achieved");
  const blankHabits = scheduledHabits.filter(
    (h) => !h.entry || (h.actual_value === 0 && !h.binary_completed)
  );

  const isEverythingDone = blankHabits.length === 0 && completedHabits.length === scheduledHabits.length;
  const isHealthyProgress = dashboard.execution_score >= 50;

  const handleConfirmPublish = async () => {
    try {
      setPublishing(true);
      await onPublish(notes.trim());
      setPublishedSuccess(true);
      setTimeout(() => {
        setPublishedSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  // Filter exercises specifically for clear visibility
  const exerciseHabits = scheduledHabits.filter((h) => {
    const catName = h.habit.category?.name?.toLowerCase() || "";
    const hName = h.habit.name.toLowerCase();
    return catName.includes("health") || hName.includes("push") || hName.includes("sit") || hName.includes("exercise");
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Send className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-foreground">
                Verify & Publish {dashboard.day_name}'s Log
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confirming execution protocol for{" "}
              <span className="font-semibold text-foreground">{dashboard.day_name}, {dashboard.date}</span>
              {" • "}Publisher: <span className="font-semibold text-primary">{profile?.name || "Ginika"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Readiness Summary Banner */}
          <div
            className={`rounded-xl border p-4 ${
              isEverythingDone
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                : isHealthyProgress
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {isEverythingDone ? (
                <Award className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              ) : isHealthyProgress ? (
                <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  {isEverythingDone
                    ? "Everything is Verified & Complete!"
                    : isHealthyProgress
                    ? "Ready to Publish: Solid Execution Progress"
                    : "Ready to Publish: Starting / Partial State"}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {isEverythingDone
                    ? `All ${scheduledHabits.length} scheduled habits and exercises reached full targets. Score: ${dashboard.execution_score}%.`
                    : blankHabits.length > 0
                    ? `You currently have ${completedHabits.length} completed habits, ${minimumHabits.length} floor minimums, and ${blankHabits.length} unlogged/blank habits. You can publish now for ${dashboard.day_name}, and re-publish anytime as you log more!`
                    : `Execution score is ${dashboard.execution_score}%. All scheduled habits have been logged.`}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Quick Review */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-background p-3 text-center">
              <span className="text-xs text-muted-foreground font-medium">Execution Score</span>
              <div className="text-xl font-extrabold font-mono text-primary mt-0.5">
                {dashboard.execution_score}%
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 text-center">
              <span className="text-xs text-muted-foreground font-medium">Targets Achieved</span>
              <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {completedHabits.length}/{scheduledHabits.length}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 text-center">
              <span className="text-xs text-muted-foreground font-medium">Floor Protected</span>
              <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {dashboard.minimum_achieved_count}
              </div>
            </div>
          </div>

          {/* Exercise Focus Check (Push-ups, Sit-ups, Cardio) */}
          {exerciseHabits.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  Exercises Verification
                </h4>
                <span className="text-xs text-muted-foreground">
                  Push-ups, Sit-ups & Physical Execution
                </span>
              </div>
              <div className="rounded-xl border border-border divide-y divide-border bg-background">
                {exerciseHabits.map((h) => {
                  const isDone = ["Completed", "Target Achieved", "Target Exceeded"].includes(h.status);
                  const isMin = h.status === "Minimum Achieved";
                  const isBlank = h.actual_value === 0 && !h.binary_completed;

                  return (
                    <div key={h.habit.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            isDone ? "bg-emerald-500" : isMin ? "bg-amber-500" : "bg-muted-foreground/30"
                          }`}
                        />
                        <div>
                          <span className="font-semibold text-foreground">{h.habit.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (Target: {h.habit.target_value} {h.habit.unit || "reps"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {h.actual_value} {h.habit.unit || ""}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isDone
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isMin
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isBlank ? "Blank / 0" : h.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Other Habits Verification Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              All Scheduled Habits for {dashboard.day_name}
            </h4>
            <div className="rounded-xl border border-border divide-y divide-border bg-background max-h-48 overflow-y-auto">
              {scheduledHabits.map((h) => {
                const isDone = ["Completed", "Target Achieved", "Target Exceeded"].includes(h.status);
                const isBlank = h.actual_value === 0 && !h.binary_completed;

                return (
                  <div key={h.habit.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: h.habit.category?.color || "#3b82f6" }}
                      />
                      <span className="truncate font-medium text-foreground">{h.habit.name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {h.habit.category?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {h.habit.tracking_type === "BINARY"
                          ? h.binary_completed
                            ? "Done"
                            : "No"
                          : `${h.actual_value} / ${h.habit.target_value || h.habit.minimum_value} ${h.habit.unit || ""}`}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : isBlank
                            ? "bg-muted text-muted-foreground"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isBlank ? "Blank" : h.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Publishing Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Daily Execution Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Completed morning workout & deep coding session."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Success message banner */}
          {publishedSuccess && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {dashboard.day_name} log published & saved successfully!
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4 shrink-0">
          <div className="text-xs text-muted-foreground">
            {publication?.is_published ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Previously published at{" "}
                {publication.published_at ? new Date(publication.published_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "earlier"}
              </span>
            ) : (
              <span>Not published yet for {dashboard.day_name}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-publish-day-btn"
              type="button"
              disabled={publishing || publishedSuccess}
              onClick={handleConfirmPublish}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {publishing
                  ? "Publishing..."
                  : publishedSuccess
                  ? "Published ✓"
                  : `Publish & Save ${dashboard.day_name} Log`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
