"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskFormData } from "@/types/task";

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => Promise<{ error?: string | null }>;
  onCancel: () => void;
  defaultPermanent?: boolean;
}

export function TaskForm({
  onSubmit,
  onCancel,
  defaultPermanent = false,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isPermanent, setIsPermanent] = useState(defaultPermanent);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [repeatInterval, setRepeatInterval] = useState<1 | 7 | 30>(7);
  const [repeatTime, setRepeatTime] = useState("08:00");
  const [repeatWeekday, setRepeatWeekday] = useState("mon");
  const [repeatMonthDay, setRepeatMonthDay] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const repeatAnchor =
      repeatInterval === 1
        ? `time:${repeatTime}`
        : repeatInterval === 7
          ? `${repeatWeekday}@${repeatTime}`
          : `${repeatMonthDay}@${repeatTime}`;

    const result = await onSubmit({
      title,
      description: description || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      difficulty,
      is_permanent: isPermanent,
      repeat_interval_days: isPermanent ? repeatInterval : undefined,
      repeat_anchor: isPermanent ? repeatAnchor : undefined,
    });
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-300">
          Task
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          className="bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-300">
          Details (optional)
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any extra details..."
          className="bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline" className="text-zinc-300">
          Deadline (optional)
        </Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div>
          <p className="text-sm text-zinc-200">Permanent task</p>
          <p className="text-xs text-zinc-500">Repeats after completion</p>
        </div>
        <button
          type="button"
          onClick={() => setIsPermanent((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPermanent ? "bg-blue-600" : "bg-zinc-700"
          }`}
          aria-pressed={isPermanent}
          aria-label="Toggle permanent task"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isPermanent ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {isPermanent && (
        <div className="space-y-2">
          <Label className="text-zinc-300">Repeat frequency</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Daily", value: 1 as const },
              { label: "Weekly", value: 7 as const },
              { label: "Monthly", value: 30 as const },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRepeatInterval(option.value)}
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                  repeatInterval === option.value
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPermanent && (
        <div className="space-y-2">
          <Label className="text-zinc-300">Specific time</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {repeatInterval === 7 && (
              <select
                value={repeatWeekday}
                onChange={(e) => setRepeatWeekday(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                <option value="mon">Monday</option>
                <option value="tue">Tuesday</option>
                <option value="wed">Wednesday</option>
                <option value="thu">Thursday</option>
                <option value="fri">Friday</option>
                <option value="sat">Saturday</option>
                <option value="sun">Sunday</option>
              </select>
            )}
            {repeatInterval === 30 && (
              <select
                value={repeatMonthDay}
                onChange={(e) => setRepeatMonthDay(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={String(day)}>
                    Day {day}
                  </option>
                ))}
              </select>
            )}
            <input
              type="time"
              value={repeatTime}
              onChange={(e) => setRepeatTime(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-zinc-300">
          Difficulty (tiles earned)
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                difficulty === d
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              +{d} {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
        >
          {loading ? "Adding..." : "Add Task"}
        </Button>
      </div>
    </form>
  );
}
