import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

export default function AdminPage() {
  const { user, loading, logout } = usePageSession();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [targetUser, setTargetUser] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/users");
      setRows(data.subscriptions || []);
    } catch {
      toast.error("Admin permission required");
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        load();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [load, user]);

  const pendingCount = useMemo(() => rows.filter((row) => row.status === "pending").length, [rows]);

  const decide = async (id, action) => {
    try {
      await api.post("/api/admin/approve-payment", { subscription_id: id, action });
      toast.success(action === "approve" ? "Payment approved" : "Payment rejected");
      await load();
    } catch {
      toast.error("Operation failed");
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/admin/notify-user", { user_id: targetUser, message });
      toast.success("Notification sent");
      setMessage("");
      setTargetUser("");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to send notification");
    }
  };

  return (
    <AppShell user={user} onLogout={logout} active="/admin" title="Admin Operations" subtitle="Payments, users, and notifications">
      {loading ? <div className="surface p-6">Loading admin panel...</div> : null}
      <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-4">
        <SectionCard title="Subscription Queue" subtitle="Manual payment approvals">
          <div className="flex gap-3 mb-4 text-sm text-stone-700">
            <div className="rounded-2xl bg-white/80 border border-stone-200 px-4 py-3">Total records: <strong>{rows.length}</strong></div>
            <div className="rounded-2xl bg-white/80 border border-stone-200 px-4 py-3">Pending: <strong>{pendingCount}</strong></div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-200">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Billing</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Screenshot</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 align-top">
                    <td className="py-3 pr-4 max-w-[180px] break-all">{row.user_id}</td>
                    <td className="py-3 pr-4">{row.plan}</td>
                    <td className="py-3 pr-4">{row.billing_cycle || "monthly"}</td>
                    <td className="py-3 pr-4">{row.status}</td>
                    <td className="py-3 pr-4">
                      {row.screenshot_url ? (
                        <a href={row.screenshot_url} target="_blank" rel="noreferrer" className="underline">View</a>
                      ) : "-"}
                    </td>
                    <td className="py-3 pr-4">{row.payment_phone || "-"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-primary text-xs" onClick={() => decide(row.id, "approve")}>Approve</button>
                        <button className="btn btn-ghost text-xs" onClick={() => decide(row.id, "reject")}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Send Notification" subtitle="User communication">
          <form className="space-y-3" onSubmit={sendNotification}>
            <input className="input" placeholder="User ID" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} />
            <textarea className="input" rows={6} placeholder="Message to user" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button className="btn btn-primary w-full" type="submit">Send Notification</button>
          </form>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
