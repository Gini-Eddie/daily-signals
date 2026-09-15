import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { HeaderStats } from "./components/TodayDashboard/HeaderStats";
import { SignalsSection } from "./components/TodayDashboard/SignalsSection";
import { FastDailyLogging } from "./components/TodayDashboard/FastDailyLogging";
import { DailyReflectionCard } from "./components/TodayDashboard/DailyReflectionCard";
import { PersonalIntakeBanner } from "./components/Intake/PersonalIntakeBanner";
import { PersonalIntakeModal } from "./components/Intake/PersonalIntakeModal";
import { PublishDayModal } from "./components/Publish/PublishDayModal";
import { HistoryView } from "./components/History/HistoryView";
import { WeeklyAnalyticsView } from "./components/Analytics/WeeklyAnalyticsView";
import { WeeklyReviewView } from "./components/Review/WeeklyReviewView";
import { HabitManagementView } from "./components/Habits/HabitManagementView";
import { BackendCodeModal } from "./components/BackendInspector/BackendCodeModal";
import { TodayDashboard, UserProfile } from "./types";
import { api } from "./services/api";

export function App() {
  const [activeTab, setActiveTab] = useState<
    "today" | "history" | "analytics" | "review" | "habits" | "backend"
  >("today");

  const [dashboard, setDashboard] = useState<TodayDashboard | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadTodayDashboard = useCallback(async () => {
    try {
      const [dashData, profileData] = await Promise.all([
        api.getDashboard(),
        api.getUserProfile(),
      ]);
      setDashboard(dashData);
      setProfile(profileData);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setError("Unable to connect to Daily Signals API. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayDashboard();
  }, [loadTodayDashboard]);

  const handleSaveProfile = async (data: { name: string; role?: string; motto?: string }) => {
    const updated = await api.saveUserProfile(data);
    setProfile(updated);
    showToast(`Profile updated: ${updated.name}`);
  };

  const handleQuickCheckIn = async () => {
    const res = await api.checkInUser(dashboard?.date || getTodayStr());
    if (profile) {
      setProfile({
        ...profile,
        checked_in_today: true,
        checkin_streak: res.checkin_streak,
      });
    }
    showToast(`Checked in for ${dashboard?.day_name || "Today"}!`);
  };

  const handleClearDay = async () => {
    try {
      setIsClearing(true);
      await api.clearDayEntries(dashboard?.date || getTodayStr());
      await loadTodayDashboard();
      showToast(`${dashboard?.day_name || "Today"}'s habit list reset to blank! Ready for new inputs.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to reset habit values");
    } finally {
      setIsClearing(false);
    }
  };

  const handlePublishDay = async (notes?: string) => {
    const pub = await api.publishDay(dashboard?.date || getTodayStr(), notes);
    if (dashboard) {
      setDashboard({
        ...dashboard,
        publication: pub,
      });
    }
    showToast(`🎉 ${dashboard?.day_name || "Tuesday"}'s log saved & published successfully!`);
    await loadTodayDashboard();
  };

  const handleResetData = async () => {
    try {
      await api.resetStarterData();
      await loadTodayDashboard();
      showToast("Starter categories, habits, signals restored!");
    } catch (err) {
      console.error("Failed to reset data:", err);
      showToast("Failed to reset demo data");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold shadow-xl animate-fade-in flex items-center gap-2 border border-slate-700">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Navigation & Brand */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayScore={dashboard?.execution_score || 0}
        onResetData={handleResetData}
        profile={profile}
        publication={dashboard?.publication}
        onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadTodayDashboard()}
              className="font-bold underline cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab 1: Today Dashboard */}
        {activeTab === "today" && (
          <div>
            {loading || !dashboard ? (
              <div className="text-center py-24 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full mb-3" />
                <p className="text-xs text-slate-500 font-medium">
                  Loading Today's Execution Dashboard...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personalized Intake & Status Banner */}
                <PersonalIntakeBanner
                  profile={profile}
                  currentDateStr={dashboard.date || getTodayStr()}
                  dayName={dashboard.day_name}
                  publication={dashboard.publication || null}
                  onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
                  onQuickCheckIn={handleQuickCheckIn}
                  onOpenPublishModal={() => setIsPublishModalOpen(true)}
                  onClearDayEntries={handleClearDay}
                  isClearing={isClearing}
                />

                {/* 1. Header Execution Stats & Metrics */}
                <HeaderStats dashboard={dashboard} />

                {/* 2. Today's 3 Signals */}
                <SignalsSection
                  signals={dashboard.signals}
                  currentDate={dashboard.date || getTodayStr()}
                  onRefresh={loadTodayDashboard}
                />

                {/* 3. Fast Daily Logging by Category */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Daily Execution Logging
                      </h3>
                      <p className="text-xs text-slate-500">
                        Record daily progress with rapid increment buttons or direct numbers
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono-num hidden sm:inline">
                      Changes auto-save immediately
                    </span>
                  </div>

                  <FastDailyLogging
                    habits={dashboard.habits}
                    currentDate={dashboard.date || getTodayStr()}
                    onRefresh={loadTodayDashboard}
                  />
                </div>

                {/* 4. Daily Reflection Card */}
                <DailyReflectionCard
                  reflection={dashboard.reflection}
                  currentDate={dashboard.date || getTodayStr()}
                  onRefresh={loadTodayDashboard}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: History View */}
        {activeTab === "history" && <HistoryView />}

        {/* Tab 3: Weekly Analytics View */}
        {activeTab === "analytics" && <WeeklyAnalyticsView />}

        {/* Tab 4: Weekly Review View */}
        {activeTab === "review" && <WeeklyReviewView />}

        {/* Tab 5: Habits Management View */}
        {activeTab === "habits" && <HabitManagementView />}

        {/* Tab 6: Python FastAPI Specification Inspector */}
        {activeTab === "backend" && <BackendCodeModal />}
      </main>

      {/* Modals */}
      <PersonalIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onCheckIn={handleQuickCheckIn}
        currentDateStr={dashboard?.date || getTodayStr()}
        dayName={dashboard?.day_name || "Today"}
      />

      <PublishDayModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        dashboard={dashboard}
        profile={profile}
        onPublish={handlePublishDay}
        publication={dashboard?.publication || null}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-slate-700">
            "Measure execution. Study the trend. Improve the system."
          </p>
          <p className="text-[11px] text-slate-400">
            Daily Signals — Personal Execution & Habit Tracking System
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

