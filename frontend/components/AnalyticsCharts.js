import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export default function AnalyticsCharts({ analytics, compact = false }) {
  const chartHeight = compact ? 220 : 256;

  return (
    <div className="surface p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-sm text-stone-600">
          Current streak: <strong>{analytics?.overview?.currentStreak || 0}</strong> days, longest streak: <strong>{analytics?.overview?.longestStreak || 0}</strong>, completion: <strong>{analytics?.overview?.completionRate || 0}%</strong>
        </p>
      </div>
      <div className={`grid gap-4 ${compact ? "xl:grid-cols-2" : "grid-cols-1"}`}>
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 md:p-4">
          <h3 className="font-medium mb-2">Weekly Completion</h3>
          <div style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={chartHeight}>
              <BarChart data={analytics?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#b78329" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-3 md:p-4">
          <h3 className="font-medium mb-2">Monthly Trend</h3>
          <div style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={chartHeight}>
              <LineChart data={analytics?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#5f6b6e" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
