import { useMemo, useState } from "react";

const badgeRules = [
  {
    threshold: 3,
    label: "Warm Start",
    description: "Earned after the first few days of building the habit.",
  },
  {
    threshold: 7,
    label: "Momentum Starter",
    description: "Unlocked after one disciplined week of consistency.",
  },
  {
    threshold: 14,
    label: "Consistency Builder",
    description: "Unlocked when the habit becomes part of the routine.",
  },
  {
    threshold: 21,
    label: "Routine Guardian",
    description: "Unlocked when the streak begins to feel stable.",
  },
  {
    threshold: 30,
    label: "Monthly Anchor",
    description: "Unlocked for one full month of sustained execution.",
  },
  {
    threshold: 60,
    label: "Reliability Core",
    description: "Unlocked when performance becomes dependable.",
  },
  {
    threshold: 100,
    label: "Legacy Streak",
    description: "Unlocked for exceptional long-term discipline.",
  },
];

function getProgress(previousThreshold, currentThreshold, streak) {
  const range = currentThreshold - previousThreshold;
  const current = Math.min(Math.max(streak - previousThreshold, 0), range);
  return range ? Math.round((current / range) * 100) : 0;
}

export default function BadgeWall({ streak = 0 }) {
  const badges = useMemo(() => badgeRules.map((badge, index) => {
    const earned = streak >= badge.threshold;
    const previousThreshold = index === 0 ? 0 : badgeRules[index - 1].threshold;
    const progress = getProgress(previousThreshold, badge.threshold, streak);

    return {
      ...badge,
      earned,
      progress,
      index,
      previousThreshold,
    };
  }), [streak]);

  const [selectedLabel, setSelectedLabel] = useState(badges[0]?.label || "");
  const selectedBadge = badges.find((badge) => badge.label === selectedLabel) || badges[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {badges.map((badge) => (
          <button
            key={badge.label}
            type="button"
            onClick={() => setSelectedLabel(badge.label)}
            className={`rounded-[18px] border p-3 text-left transition-all ${selectedBadge?.label === badge.label
              ? "border-[var(--accent)] bg-[linear-gradient(180deg,#fff9ed_0%,#fff3d8_100%)] shadow-[0_10px_24px_rgba(183,131,41,0.14)]"
              : "border-stone-200 bg-white/80 hover:border-stone-300 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold ${badge.earned ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-stone-300 bg-stone-100 text-stone-500"}`}>
                {String(badge.threshold).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Badge {badge.index + 1}</p>
                <h4 className="text-sm font-semibold truncate">{badge.label}</h4>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedBadge ? (
        <div className="rounded-[22px] border border-stone-200 bg-white/85 p-4 md:p-5 shadow-[0_10px_24px_rgba(35,31,24,0.05)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border text-base font-semibold ${selectedBadge.earned ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-stone-300 bg-stone-100 text-stone-500"}`}>
                {String(selectedBadge.threshold).padStart(2, "0")}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Selected badge</p>
                <h4 className="mt-1 text-2xl font-semibold tracking-tight">{selectedBadge.label}</h4>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-2xl">
                  {selectedBadge.description}
                </p>
              </div>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedBadge.earned ? "bg-[var(--accent)] text-white" : "bg-stone-100 text-stone-500"}`}>
              {selectedBadge.earned ? "Unlocked" : "Locked"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone-500 mb-2">
                <span>Streak target</span>
                <span>{selectedBadge.threshold} days</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div className={`h-full rounded-full ${selectedBadge.earned ? "bg-[var(--accent)]" : "bg-stone-400/70"}`} style={{ width: `${selectedBadge.earned ? 100 : selectedBadge.progress}%` }} />
              </div>
            </div>
            <div className="text-sm text-stone-600 md:text-right">
              {selectedBadge.earned
                ? "Achievement earned through consistency."
                : `${streak} / ${selectedBadge.threshold} days completed.`}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
