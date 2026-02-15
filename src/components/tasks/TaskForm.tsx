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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await onSubmit({
      title,
      description: description || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      difficulty,
      is_permanent: isPermanent,
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
