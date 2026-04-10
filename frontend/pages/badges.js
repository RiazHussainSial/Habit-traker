import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import BadgeWall from "@/components/BadgeWall";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function BadgesPage() {
  const { user, loading, logout } = usePageSession();
  const [analytics, setAnalytics] = useState({ overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 } });
  const [habits, setHabits] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [analyticsRes, habitsRes] = await Promise.all([api.get("/api/analytics"), api.get("/api/habits")]);
        setAnalytics(analyticsRes.data || { overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 } });
        setHabits(habitsRes.data.habits?.length || 0);
      } catch {
        toast.error("Unable to load badges");
      }
    };

    load();
  }, [user]);

  const badgeSummary = useMemo(() => {
    const streak = analytics?.overview?.currentStreak || 0;
    if (streak >= 100) return "Legend-level discipline";
    if (streak >= 60) return "Exceptional consistency";
    if (streak >= 30) return "Monthly momentum secured";
    if (streak >= 14) return "Strong routine established";
    if (streak >= 7) return "First milestone unlocked";
    return "Start the streak to unlock badges";
  }, [analytics]);

  return (
    <AppShell
      user={user}
      onLogout={logout}
      active="/badges"
      title="Badge Library"
      subtitle="Achievement rewards"
      rightSlot={<p className="text-sm text-stone-600">Updated {dayjs().format("DD MMM YYYY")}</p>}
    >
      {loading ? <div className="surface p-6">Loading badges...</div> : null}

      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-4">
        <SectionCard title="Progress Summary" subtitle="Your current status">
          <div className="space-y-4 text-sm text-stone-700">
            <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Current streak</p>
              <p className="mt-1 text-3xl font-semibold text-stone-900">{analytics?.overview?.currentStreak || 0}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Longest streak</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{analytics?.overview?.longestStreak || 0}</p>
              </div>
              <div className="rounded-[22px] border border-stone-200 bg-white/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Active habits</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{habits}</p>
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--accent)]/35 bg-[linear-gradient(180deg,#fff9ec_0%,#fff4dc_100%)] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Badge status</p>
              <p className="mt-2 text-base font-semibold text-stone-900">{badgeSummary}</p>
              <p className="mt-1 text-sm text-stone-600">Earn more badges by extending your streak with daily consistency.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Badge Library" subtitle="Tap a badge for details">
          <BadgeWall streak={analytics?.overview?.currentStreak || 0} />
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}