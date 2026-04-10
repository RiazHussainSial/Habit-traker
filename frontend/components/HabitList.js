import dayjs from "dayjs";

export default function HabitList({ habits, logsByHabit, onToggleComplete, onDelete }) {
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="surface p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-3">Today&apos;s Habits</h2>
      <div className="space-y-3">
        {habits.map((habit) => {
          const isDone = logsByHabit[habit.id]?.[today] === "completed";
          return (
            <div key={habit.id} className="border border-stone-200 rounded-xl p-3 bg-white/80 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{habit.title}</p>
                <p className="text-sm text-stone-600">{habit.description || "No description"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost text-sm" onClick={() => onToggleComplete(habit.id, !isDone)}>
                  {isDone ? "Completed" : "Mark Complete"}
                </button>
                <button className="btn btn-ghost text-sm" onClick={() => onDelete(habit.id)}>Delete</button>
              </div>
            </div>
          );
        })}
        {!habits.length && <p className="text-stone-500">No habits yet. Create your first routine.</p>}
      </div>
    </div>
  );
}
