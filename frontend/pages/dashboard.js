import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import HabitForm from "@/components/HabitForm";
import HabitList from "@/components/HabitList";
import QuoteCard from "@/components/QuoteCard";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import api from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [ai, setAi] = useState({
    quote: "Discipline is your daily contract with your future self.",
    habit_suggestion: "Stack a small habit after breakfast.",
    insight: "Start tiny, stay consistent, then scale.",
  });

  const logsByHabit = useMemo(() => {
    const mapped = {};
    logs.forEach((item) => {
      if (!mapped[item.habit_id]) mapped[item.habit_id] = {};
      mapped[item.habit_id][item.date] = item.status;
    });
    return mapped;
  }, [logs]);

  const loadAll = useCallback(async () => {
    const endpoints = [
      { key: "habits", url: "/api/habits" },
      { key: "logs", url: "/api/habit-logs" },
      { key: "analytics", url: "/api/analytics" },
      { key: "notifications", url: "/api/notifications" },
    ];

    const results = await Promise.allSettled(endpoints.map((item) => api.get(item.url)));
    const getValue = (key) => {
      const idx = endpoints.findIndex((e) => e.key === key);
      return results[idx];
    };

    const habitsResult = getValue("habits");
    const logsResult = getValue("logs");
    const analyticsResult = getValue("analytics");
    const notesResult = getValue("notifications");

    if (habitsResult.status === "fulfilled") {
      setHabits(habitsResult.value.data.habits || []);
    } else {
      setHabits([]);
    }

    if (logsResult.status === "fulfilled") {
      setLogs(logsResult.value.data.logs || []);
    } else {
      setLogs([]);
    }

    if (analyticsResult.status === "fulfilled") {
      setAnalytics(analyticsResult.value.data);
    } else {
      setAnalytics({
        overview: { currentStreak: 0, longestStreak: 0, completionRate: 0 },
        weekly: [],
        monthly: [],
      });
    }

    if (notesResult.status === "fulfilled") {
      setNotifications(notesResult.value.data.notifications || []);
    } else {
      setNotifications([]);
    }
  }, []);

  const fetchAi = useCallback(async () => {
    try {
      const missedToday = habits.length > 0 && habits.some((h) => logsByHabit[h.id]?.[dayjs().format("YYYY-MM-DD")] !== "completed");
      const { data } = await api.post("/api/motivation", { emotion: "focused", missedHabit: missedToday });
      setAi(data);
    } catch {
      setAi({
        quote: "Small improvements, repeated daily, compound into measurable outcomes.",
        habit_suggestion: "Choose one habit that is easy to repeat today.",
        insight: "AI insight is temporarily unavailable, but the workflow remains intact.",
      });
    }
  }, [habits, logsByHabit]);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) {
        router.replace("/login");
        return;
      }
      try {
        setUser(data.session.user);
        await loadAll();
        await fetchAi();
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [fetchAi, loadAll, router]);

  const handleCreateHabit = async (payload) => {
    try {
      await api.post("/api/habits", payload);
      toast.success("Habit added");
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Could not create habit");
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      await api.delete(`/api/habits/${id}`);
      toast.success("Habit removed");
      await loadAll();
    } catch {
      toast.error("Could not delete habit");
    }
  };

  const handleToggle = async (habitId, completed) => {
    try {
      await api.post("/api/habit-logs", {
        habit_id: habitId,
        date: dayjs().format("YYYY-MM-DD"),
        status: completed ? "completed" : "missed",
      });
      await loadAll();
    } catch {
      toast.error("Could not update habit log");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const todayKey = dayjs().format("YYYY-MM-DD");
  const todayCompleted = habits.reduce((sum, habit) => {
    return sum + (logsByHabit[habit.id]?.[todayKey] === "completed" ? 1 : 0);
  }, 0);
  const todayTotal = habits.length;
  const todayRate = todayTotal ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <AppShell
      user={user}
      onLogout={logout}
      active="/dashboard"
      title="Operations Dashboard"
      subtitle="Daily overview"
      rightSlot={
        <div className="flex flex-wrap gap-2">
          <Link href="/habits" className="btn btn-ghost text-sm">Manage Habits</Link>
          <Link href="/insights" className="btn btn-ghost text-sm">Analytics</Link>
          <Link href="/quotes" className="btn btn-ghost text-sm">AI Quotes</Link>
        </div>
      }
    >
      {loading ? (
        <div className="surface p-6 mb-4">Loading dashboard...</div>
      ) : null}
      <section className="surface p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Performance snapshot</p>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Today at a glance</h3>
          </div>
          <p className="text-sm text-stone-500">Updated for {dayjs().format("DD MMM YYYY")}</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Current streak</p>
            <h4 className="kpi-value">{analytics?.overview?.currentStreak || 0}</h4>
            <p className="kpi-note">days in motion</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Longest streak</p>
            <h4 className="kpi-value">{analytics?.overview?.longestStreak || 0}</h4>
            <p className="kpi-note">best historical run</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Completion</p>
            <h4 className="kpi-value">{analytics?.overview?.completionRate || 0}%</h4>
            <p className="kpi-note">overall consistency</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="kpi-card">
            <p className="kpi-label">Today complete</p>
            <h4 className="kpi-value">{todayCompleted}/{todayTotal || 0}</h4>
            <p className="kpi-note">daily execution {todayRate}%</p>
          </motion.div>
        </div>
      </section>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-[1.55fr_1fr] gap-4">
        <div className="space-y-4">
          <HabitForm onCreate={handleCreateHabit} />
          <HabitList habits={habits} logsByHabit={logsByHabit} onToggleComplete={handleToggle} onDelete={handleDeleteHabit} />
        </div>

        <div className="space-y-4">
          <QuoteCard
            quote={ai.quote}
            suggestion={ai.habit_suggestion}
            insight={ai.insight}
            onRefresh={fetchAi}
          />
          <div className="surface p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-3">Notifications</h3>
            <div className="space-y-2 text-sm">
              {notifications.length ? notifications.map((n) => (
                <p key={n.id} className="notice-item">{n.message}</p>
              )) : <p className="text-stone-600">No notifications.</p>}
            </div>
          </div>
        </div>
      </motion.div>

      <AnalyticsCharts analytics={analytics} compact />

      <Footer />
    </AppShell>
  );
}
