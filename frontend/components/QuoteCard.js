import { motion } from "framer-motion";

export default function QuoteCard({ quote, suggestion, insight, onRefresh }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="quote-card"
    >
      <div className="quote-card-overlay" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/65">Daily quote</p>
            <h2 className="text-2xl font-semibold text-white">AI Motivational Brief</h2>
          </div>
          <button className="btn btn-ghost text-sm bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={onRefresh}>Refresh</button>
        </div>
        <p className="text-xl leading-relaxed text-white font-medium">&ldquo;{quote}&rdquo;</p>
        <div className="mt-5 grid gap-3">
          <div className="quote-insight-item">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Suggestion</p>
            <p className="text-sm text-white/90 mt-1">{suggestion}</p>
          </div>
          <div className="quote-insight-item">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Insight</p>
            <p className="text-sm text-white/90 mt-1">{insight}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
