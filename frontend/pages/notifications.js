import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function NotificationsPage() {
  const { user, loading, logout } = usePageSession();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data.notifications || []);
      } catch {
        toast.error("Unable to load notifications");
      }
    };
    load();
  }, [user]);

  return (
    <AppShell user={user} onLogout={logout} active="/notifications" title="Notification Center" subtitle="Daily reminders">
      {loading ? <div className="surface p-6">Loading notifications...</div> : null}
      <SectionCard title="Recent Updates" subtitle="Reminder stream">
        <div className="space-y-3">
          {notifications.length ? notifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{notification.message}</p>
                <p className="text-xs text-stone-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${notification.read ? "bg-stone-100 text-stone-600" : "bg-[var(--accent)] text-white"}`}>
                {notification.read ? "Read" : "Unread"}
              </span>
            </div>
          )) : <p className="text-stone-600">No notifications yet. Daily reminders and admin messages will appear here.</p>}
        </div>
      </SectionCard>

      <Footer />
    </AppShell>
  );
}
