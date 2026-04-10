import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

const initialForm = { title: "", description: "", frequency: "daily" };

export default function HabitsPage() {
  const { user, loading, logout } = usePageSession();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const logsByHabit = useMemo(() => {
    const mapped = {};
    logs.forEach((entry) => {
      if (!mapped[entry.habit_id]) mapped[entry.habit_id] = {};
      mapped[entry.habit_id][entry.date] = entry.status;
    });
    return mapped;
  }, [logs]);

  const loadData = useCallback(async () => {
    const [habitsRes, logsRes] = await Promise.allSettled([api.get("/api/habits"), api.get("/api/habit-logs")]);
    setHabits(habitsRes.status === "fulfilled" ? habitsRes.value.data.habits || [] : []);
    setLogs(logsRes.status === "fulfilled" ? logsRes.value.data.logs || [] : []);
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData, user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/habits/${editingId}`, form);
        toast.success("Habit updated");
      } else {
        await api.post("/api/habits", form);
        toast.success("Habit created");
      }
      setForm(initialForm);
      setEditingId(null);
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to save habit");
    }
  };

  const editHabit = (habit) => {
    setEditingId(habit.id);
    setForm({ title: habit.title, description: habit.description || "", frequency: habit.frequency || "daily" });
  };

  const removeHabit = async (id) => {
    try {
      await api.delete(`/api/habits/${id}`);
      toast.success("Habit deleted");
      await loadData();
    } catch {
      toast.error("Unable to delete habit");
    }
  };

  const toggleToday = async (habitId, currentStatus) => {
    try {
      await api.post("/api/habit-logs", {
        habit_id: habitId,
        date: dayjs().format("YYYY-MM-DD"),
        status: currentStatus === "completed" ? "missed" : "completed",
      });
      await loadData();
    } catch {
      toast.error("Unable to update completion");
    }
  };

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <AppShell user={user} onLogout={logout} active="/habits" title="Habit Workspace" subtitle="Management">
      {loading ? <div className="surface p-6">Loading habits...</div> : null}
      <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <SectionCard title={editingId ? "Edit Habit" : "Create Habit"} subtitle="Routine Builder">
          <form className="space-y-3" onSubmit={submit}>
            <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">{editingId ? "Save Changes" : "Add Habit"}</button>
              {editingId ? <button className="btn btn-ghost" type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancel</button> : null}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Current Habits" subtitle="Daily execution">
          <div className="space-y-3">
            {habits.length ? habits.map((habit) => {
              const status = logsByHabit[habit.id]?.[today] || "incomplete";
              return (
                <div key={habit.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-lg">{habit.title}</h4>
                    <p className="text-sm text-stone-600">{habit.description || "No description"}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mt-2">{habit.frequency}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-ghost text-sm" onClick={() => toggleToday(habit.id, status)}>
                      {status === "completed" ? "Mark Incomplete" : "Mark Complete"}
                    </button>
                    <button className="btn btn-ghost text-sm" onClick={() => editHabit(habit)}>Edit</button>
                    <button className="btn btn-primary text-sm" onClick={() => removeHabit(habit.id)}>Delete</button>
                  </div>
                </div>
              );
            }) : <p className="text-stone-600">No habits yet. Create one using the form on the left.</p>}
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
