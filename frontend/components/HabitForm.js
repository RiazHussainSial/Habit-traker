import { useState } from "react";

export default function HabitForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title, description, frequency });
    setTitle("");
    setDescription("");
    setFrequency("daily");
  };

  return (
    <form onSubmit={submit} className="surface p-4 md:p-6 space-y-3">
      <h2 className="text-xl font-semibold">Create Habit</h2>
      <input className="input" placeholder="Habit title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" rows={3} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button className="btn btn-primary" type="submit">Add Habit</button>
    </form>
  );
}
