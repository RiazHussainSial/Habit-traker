import { motion } from "framer-motion";

export default function PlanCard({ title, price, features, recommended, onSelect, billingCycle, description }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`surface p-5 md:p-6 relative overflow-hidden ${recommended ? "ring-2 ring-[var(--accent)]" : ""}`}
    >
      {recommended ? <span className="absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-[var(--accent)] text-white">Recommended</span> : null}
      <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{billingCycle}</p>
      <h3 className="text-2xl font-semibold mt-2">{title}</h3>
      <p className="text-stone-600 mt-2">{description}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold">{price}</span>
        <span className="text-sm text-stone-500 mb-1">/month equivalent</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-stone-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className="btn btn-primary w-full mt-5" onClick={onSelect}>Choose Plan</button>
    </motion.div>
  );
}
