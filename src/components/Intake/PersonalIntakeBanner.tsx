import React from "react";
import { UserCheck, Sparkles, RefreshCw, Send, Settings, CheckCircle2, RotateCcw } from "lucide-react";
import { UserProfile, DayPublication } from "../../types";

interface PersonalIntakeBannerProps {
  profile: UserProfile | null;
  currentDateStr: string;
  dayName: string;
  publication: DayPublication | null;
  onOpenIntakeModal: () => void;
  onQuickCheckIn: () => Promise<void>;
  onOpenPublishModal: () => void;
  onClearDayEntries: () => Promise<void>;
  isClearing: boolean;
}

export const PersonalIntakeBanner: React.FC<PersonalIntakeBannerProps> = ({
  profile,
  currentDateStr,
  dayName,
  publication,
  onOpenIntakeModal,
  onQuickCheckIn,
  onOpenPublishModal,
  onClearDayEntries,
  isClearing,
}) => {
  const userName = profile?.name || "Ginika";
  const isCheckedIn = Boolean(profile?.checked_in_today);
  const isPublished = Boolean(publication?.is_published);

  return (
    <div className="mb-6 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* User Identity & Greeting */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 font-bold text-lg text-primary-foreground shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            {isCheckedIn && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {isCheckedIn ? `Welcome back, ${userName}!` : `Hello, ${userName}!`}
              </h2>
              {isCheckedIn ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-3 w-3" />
                  Logged in for {dayName}
                </span>
              ) : (
                <button
                  onClick={onQuickCheckIn}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Tap to check in for {dayName}
                </button>
              )}

              {isPublished && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {dayName} Log Published ✓
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              {dayName}, <span className="font-mono text-foreground font-medium">{currentDateStr}</span>
              {profile?.role ? ` • ${profile.role}` : ""}
              {profile?.motto ? ` • "${profile.motto}"` : ""}
            </p>
          </div>
        </div>

        {/* Action Controls: Start Blank, Publish, Profile Settings */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
          {/* Start Blank button */}
          <button
            id="start-blank-today-btn"
            type="button"
            disabled={isClearing}
            onClick={() => {
              if (window.confirm(`Reset ${dayName}'s habit numbers to blank (0)? This lets you start fresh.`)) {
                onClearDayEntries();
              }
            }}
            title="Reset today's habit entries to 0 to start fresh"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 hover:bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isClearing ? "animate-spin" : ""}`} />
            <span>Start Blank Today</span>
          </button>

          {/* Profile Intake button */}
          <button
            id="open-profile-btn"
            type="button"
            onClick={onOpenIntakeModal}
            title="Personalize your name and profile"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 hover:bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Profile</span>
          </button>

          {/* Check & Publish Tuesday Log Button */}
          <button
            id="publish-tuesday-btn"
            type="button"
            onClick={onOpenPublishModal}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all ${
              isPublished
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isPublished ? `Re-publish ${dayName}` : `Verify & Publish ${dayName}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
