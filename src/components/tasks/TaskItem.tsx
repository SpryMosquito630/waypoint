"use client";

import { format } from "date-fns";
import type { Task } from "@/types/task";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const difficultyLabels = ["", "Easy", "Medium", "Hard"];
const difficultyColors = ["", "text-green-400", "text-yellow-400", "text-red-400"];

export function TaskItem({ task, onComplete, onDelete }: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const isNoDeadline =
    !task.deadline ||
    new Date(task.deadline).getTime() - Date.now() > 1000 * 60 * 60 * 24 * 365 * 5;
  const isPastDeadline =
    !isNoDeadline && new Date(task.deadline!) < new Date() && !isCompleted;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isCompleted
          ? "border-zinc-800 bg-zinc-900/50 opacity-60"
          : isPastDeadline
            ? "border-red-900/50 bg-red-950/20"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      <button
        onClick={() => !isCompleted && onComplete(task.id)}
        disabled={isCompleted}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isCompleted
            ? "border-green-600 bg-green-600"
            : "border-zinc-600 hover:border-blue-500"
        }`}
      >
        {isCompleted && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? "line-through text-zinc-500" : "text-white"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500">
            {isNoDeadline
              ? "No deadline"
              : `Due ${format(new Date(task.deadline!), "MMM d, h:mm a")}`}
          </span>
          <span className={`text-xs font-medium ${difficultyColors[task.difficulty]}`}>
            +{task.difficulty} {difficultyLabels[task.difficulty]}
          </span>
          {task.is_permanent && (
            <span className="text-[10px] uppercase tracking-wider text-blue-400">
              Permanent
            </span>
          )}
        </div>
      </div>

      {!isCompleted && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
