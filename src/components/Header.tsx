import React from "react";
import { 
  CheckCircle2, 
  Calendar, 
  BarChart3, 
  FileText, 
  SlidersHorizontal, 
  Terminal,
  RotateCcw,
  Send,
  User
} from "lucide-react";
import { UserProfile, DayPublication } from "../types";

interface HeaderProps {
  activeTab: "today" | "history" | "analytics" | "review" | "habits" | "backend";
  setActiveTab: (tab: "today" | "history" | "analytics" | "review" | "habits" | "backend") => void;
  todayScore: number;
  onResetData: () => void;
  profile?: UserProfile | null;
  publication?: DayPublication | null;
  onOpenIntakeModal?: () => void;
  onOpenPublishModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  todayScore,
  onResetData,
  profile,
  publication,
  onOpenIntakeModal,
  onOpenPublishModal,
}) => {
  const navItems = [
    { id: "today" as const, label: "Today", icon: CheckCircle2, badge: `${todayScore}%` },
    { id: "history" as const, label: "History", icon: Calendar },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "review" as const, label: "Weekly Review", icon: FileText },
    { id: "habits" as const, label: "Habits", icon: SlidersHorizontal },
    { id: "backend" as const, label: "FastAPI Specs", icon: Terminal },
  ];

  const userName = profile?.name || "Ginika";
  const isCheckedIn = Boolean(profile?.checked_in_today);
  const isPublished = Boolean(publication?.is_published);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs font-bold text-sm tracking-wider">
              DS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Daily Signals</h1>
                <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Measure execution. Study the trend. Improve the system.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Profile / Mini-Auth Pill */}
            {onOpenIntakeModal && (
              <button
                id="header-user-profile-btn"
                onClick={onOpenIntakeModal}
                title="Personalized intake & check-in profile"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[100px] truncate">{userName}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isCheckedIn ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                  title={isCheckedIn ? "Checked In Today" : "Not Checked In Today"}
                />
              </button>
            )}

            {/* Quick Publish Button if on Today tab */}
            {activeTab === "today" && onOpenPublishModal && (
              <button
                id="header-publish-btn"
                onClick={onOpenPublishModal}
                className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all ${
                  isPublished
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isPublished ? "Published ✓" : "Publish Today"}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm("Reset application data to starter categories, habits, and clean state?")) {
                  onResetData();
                }
              }}
              title="Reset Demo Data"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[11px] font-mono-num font-semibold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-slate-800 text-slate-200 border border-slate-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
