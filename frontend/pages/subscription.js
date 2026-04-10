import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

const freeFeatures = [
  "Up to 3 habits",
  "Basic AI quote each day",
  "Simple completion charts",
  "Daily reminders",
];

const paidFeatures = [
  "Unlimited habits",
  "Full AI insights and suggestions",
  "Advanced analytics and streaks",
  "Calendar view and badges",
  "Priority notifications and admin support",
];

export default function SubscriptionPage() {
  const { user, loading, logout } = usePageSession();
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [paymentPhone, setPaymentPhone] = useState("03496744768");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/subscription/status");
      setSubscription(data.subscription || null);
    } catch {
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load, user]);

  const startStripe = async (cycle) => {
    try {
      const { data } = await api.post("/api/subscription/stripe", { billing_cycle: cycle });
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error(error?.response?.data?.error || "Stripe checkout unavailable");
    }
  };

  const submitManual = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please attach a screenshot");

    try {
      const formData = new FormData();
      formData.append("screenshot", file);
      formData.append("billing_cycle", billingCycle);
      formData.append("payment_phone", paymentPhone);
      formData.append("plan", selectedPlan);
      await api.post("/api/subscription/manual", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Payment screenshot submitted for admin approval");
      setFile(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to submit payment");
    }
  };

  return (
    <AppShell user={user} onLogout={logout} active="/subscription" title="Subscription Center" subtitle="Billing & access">
      {loading ? <div className="surface p-6">Loading subscription...</div> : null}

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <PlanCard
              title="Free"
              price="$0"
              billingCycle="Forever"
              description="Good for a small personal routine or trial users."
              features={freeFeatures}
              onSelect={() => toast("Free plan is active by default")}
            />
            <PlanCard
              title="Premium"
              price={billingCycle === "yearly" ? "$70" : "$7"}
              billingCycle={billingCycle === "yearly" ? "Yearly billing" : "Monthly billing"}
              description="For power users who want unlimited habits, analytics, and AI depth."
              features={paidFeatures}
              recommended
              onSelect={() => startStripe(billingCycle)}
            />
          </div>

          <SectionCard title="Manual Payment Upload" subtitle="Bank transfer or screenshot-based approval">
            <form className="space-y-3" onSubmit={submitManual}>
              <div className="grid md:grid-cols-2 gap-3">
                <select className="input" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                  <option value="premium">Premium</option>
                </select>
                <select className="input" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <input className="input" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="Payment phone number" />
              <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-sm text-stone-600">Transfer / payment number: <strong>03496744768</strong></p>
              <button className="btn btn-primary" type="submit">Submit Screenshot to Admin</button>
            </form>
          </SectionCard>
        </div>

        <SectionCard title="Plan Status" subtitle="Account access">
          <div className="space-y-4 text-sm text-stone-700">
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Current Plan</p>
              <p className="text-lg font-semibold mt-1">{subscription?.plan || "free"}</p>
              <p className="mt-1">Status: <strong>{subscription?.status || "active"}</strong></p>
              <p className="mt-1">Billing: <strong>{subscription?.billing_cycle || "monthly"}</strong></p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500">How approval works</p>
              <ul className="mt-3 space-y-2 text-sm list-disc pl-5">
                <li>Choose monthly or yearly plan.</li>
                <li>Upload your transfer screenshot.</li>
                <li>Admin reviews and activates the subscription.</li>
                <li>Once approved, premium features unlock automatically.</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
