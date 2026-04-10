import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

const panels = [
  {
    title: "Daily Habit Engine",
    text: "Create routines, mark completions, and review momentum in one focused workspace.",
  },
  {
    title: "AI Motivation",
    text: "Generate daily quotes and emotion-aware guidance with a clean premium presentation.",
  },
  {
    title: "Subscription and Admin",
    text: "Monthly and yearly plans, screenshot approval, and admin operations in separate screens.",
  },
  {
    title: "Advanced Tracking",
    text: "Calendar view, analytics, badges, and progress history for FYP-grade presentation.",
  },
];

export default function HomePage() {
  return (
    <>
    <div className="layout-shell min-h-screen py-8 md:py-10 space-y-4">
      <header className="surface px-5 md:px-6 py-4 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Habit OS</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Industrial Habit Tracker Platform</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-ghost">Login</Link>
          <Link href="/signup" className="btn btn-primary">Create Account</Link>
        </div>
      </header>

      <main className="grid lg:grid-cols-[1.25fr_0.75fr] gap-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,131,41,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(95,107,110,0.16),transparent_30%)] pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Multi-page productivity system</p>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight mt-3 leading-[1.02]">
              A professional habit app with AI, analytics, subscriptions, and admin control.
            </h2>
            <p className="mt-5 text-stone-700 max-w-2xl text-base md:text-lg leading-relaxed">
              Built for real-world use and polished presentations. Track habits, review progress, generate motivational quotes,
              manage monthly or yearly subscriptions, and approve manual payments from a dedicated admin panel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn btn-primary">Open Dashboard</Link>
              <Link href="/habits" className="btn btn-ghost">Manage Habits</Link>
              <Link href="/subscription" className="btn btn-ghost">Subscription Plans</Link>
            </div>
          </div>
        </motion.section>

        <div className="space-y-4">
          <div className="surface p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Included screens</p>
            <div className="mt-4 space-y-3">
              {[
                ["Dashboard", "Overview of streaks, completion, and AI quote of the day."],
                ["Habits", "Create, edit, delete, and complete habits quickly."],
                ["Insights", "Weekly, monthly, and streak analytics with badges."],
                ["Subscription", "Monthly/yearly plans and manual payment approval flow."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-stone-600 mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {panels.map((panel, index) => (
          <motion.div
            key={panel.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="surface p-5"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">0{index + 1}</p>
            <h3 className="text-xl font-semibold mt-2">{panel.title}</h3>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">{panel.text}</p>
          </motion.div>
        ))}
      </section>
    </div>

    <Footer />
    </>
  );
}
