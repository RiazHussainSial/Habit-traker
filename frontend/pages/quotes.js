import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import SectionCard from "@/components/SectionCard";
import api from "@/lib/apiClient";
import usePageSession from "@/lib/usePageSession";

const emotions = ["focused", "happy", "sad", "lazy", "stressed"];

export default function QuotesPage() {
  const { user, loading, logout } = usePageSession();
  const [emotion, setEmotion] = useState("focused");
  const [quote, setQuote] = useState({
    quote: "Consistency compounds faster than motivation fades.",
    habit_suggestion: "Keep the habit small and repeatable.",
    insight: "Start with one clear action.",
  });
  const [history, setHistory] = useState([]);

  const generateQuote = useCallback(async () => {
    try {
      const { data } = await api.post("/api/motivation", { emotion, missedHabit: emotion === "sad" || emotion === "lazy" });
      setQuote(data);
      setHistory((current) => [{ ...data, emotion, id: Date.now() }, ...current].slice(0, 6));
    } catch (error) {
      toast.error(error?.response?.data?.error || "Unable to generate quote");
    }
  }, [emotion]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      generateQuote();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [generateQuote, user]);

  return (
    <AppShell user={user} onLogout={logout} active="/quotes" title="AI Quote Studio" subtitle="Motivation">
      {loading ? <div className="surface p-6">Loading quotes...</div> : null}
      <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <SectionCard title="Daily AI Quote" subtitle="Animated motivation">
          <div className="flex flex-wrap gap-2 mb-5">
            {emotions.map((value) => (
              <button key={value} className={`btn ${emotion === value ? "btn-primary" : "btn-ghost"} text-sm capitalize`} onClick={() => setEmotion(value)}>
                {value}
              </button>
            ))}
            <button className="btn btn-primary text-sm" onClick={generateQuote}>Refresh Quote</button>
          </div>

          <motion.div
            key={`${quote.quote}-${emotion}`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="rounded-[28px] p-6 md:p-8 bg-[linear-gradient(145deg,#1c1b17,#2a261d)] text-white shadow-2xl"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">{emotion} mode</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight">&ldquo;{quote.quote}&rdquo;</h2>
            <p className="mt-5 text-white/80"><strong>Suggestion:</strong> {quote.habit_suggestion}</p>
            <p className="mt-2 text-white/75"><strong>Insight:</strong> {quote.insight}</p>
          </motion.div>
        </SectionCard>

        <SectionCard title="Quote History" subtitle="Recent generations">
          <div className="space-y-3">
            {history.length ? history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{item.emotion}</p>
                <p className="font-medium mt-2">{item.quote}</p>
              </div>
            )) : <p className="text-stone-600">Your generated quotes will appear here.</p>}
          </div>
        </SectionCard>
      </div>

      <Footer />
    </AppShell>
  );
}
