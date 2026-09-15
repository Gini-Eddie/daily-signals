import React, { useState } from "react";
import { User, CheckCircle, Flame, X, ShieldCheck, Sparkles } from "lucide-react";
import { UserProfile } from "../../types";

interface PersonalIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSaveProfile: (data: { name: string; role?: string; motto?: string }) => Promise<void>;
  onCheckIn: () => Promise<void>;
  currentDateStr: string;
  dayName: string;
}

export const PersonalIntakeModal: React.FC<PersonalIntakeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onCheckIn,
  currentDateStr,
  dayName,
}) => {
  const [name, setName] = useState(profile?.name || "Ginika");
  const [role, setRole] = useState(profile?.role || "Daily Execution Lead");
  const [motto, setMotto] = useState(profile?.motto || "Focus on controllable daily actions");
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      await onSaveProfile({ name: name.trim(), role: role.trim(), motto: motto.trim() });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCheckIn = async () => {
    try {
      setCheckingIn(true);
      await onCheckIn();
      setSuccessMsg(`Checked in for ${dayName}, ${currentDateStr}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {name ? name.charAt(0).toUpperCase() : "G"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Personal Intake & Profile
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Mini-Auth
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                No complex passwords needed. Personalize your name & check in for daily logging.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Daily Check-In Status Action Box */}
        <div className="my-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                {profile?.checked_in_today ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {profile?.checked_in_today ? "Checked In Today" : "Ready for Daily Check-In"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Flame className="h-3 w-3 fill-current" />
                    {profile?.checkin_streak || 1} day streak
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dayName} date: <span className="font-mono text-foreground font-medium">{currentDateStr}</span>
                </p>
              </div>
            </div>

            <button
              id="personal-intake-checkin-btn"
              type="button"
              disabled={checkingIn}
              onClick={handleQuickCheckIn}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition-all ${
                profile?.checked_in_today
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {checkingIn ? "Checking In..." : profile?.checked_in_today ? "Checked In ✓" : "Tap to Log In Today"}
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Your Name / Preferred Handle
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="user-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ginika"
                required
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Focus / Title (Optional)
            </label>
            <input
              id="user-role-input"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer & Builder"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Personal Execution Motto
            </label>
            <input
              id="user-motto-input"
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g. Measure execution. Study the trend. Improve the system."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {successMsg && (
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Done
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
