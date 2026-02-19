"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Task } from "@/types/task";
import {
  getRepeatLabel,
  getDueAt,
  getReminderWindowMs,
} from "@/lib/tasks/repeat";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isFading?: boolean;
}

const difficultyLabels = ["", "Easy", "Medium", "Hard"];
const difficultyColors = ["", "text-green-400", "text-yellow-400", "text-red-400"];


export function TaskItem({
  task,
  onComplete,
  onDelete,
  isFading = false,
}: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const isNoDeadline =
    !task.deadline ||
    new Date(task.deadline).getTime() - Date.now() > 1000 * 60 * 60 * 24 * 365 * 5;
  const isPastDeadline =
    !isNoDeadline && new Date(task.deadline!) < new Date() && !isCompleted;
  const dueAt = getDueAt(task);
  const isPastDue = !!dueAt && dueAt < new Date() && !isCompleted;
  const remindWindowMs = getReminderWindowMs(task);
  const isDueSoon =
    !isCompleted &&
    !!dueAt &&
    !isPastDue &&
    dueAt.getTime() - Date.now() <= remindWindowMs;

  const [burst, setBurst] = useState<
    { x: number; y: number; delay: number }[]
  >([]);

  const triggerBurst = () => {
    const items = Array.from({ length: 10 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 270;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        delay: Math.random() * 0.08,
      };
    });
    setBurst(items);
    window.setTimeout(() => setBurst([]), 800);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isCompleted
          ? "border-zinc-800 bg-zinc-900/50 opacity-60"
          : isPastDeadline
            ? "border-red-900/50 bg-red-950/20"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      } ${isFading ? "task-fade-out" : ""}`}
    >
      <button
        onClick={() => {
          if (isCompleted) return;
          triggerBurst();
          onComplete(task.id);
        }}
        disabled={isCompleted}
        className={`relative w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isCompleted
            ? "border-green-600 bg-green-600"
            : "border-zinc-600 hover:border-blue-500"
        }`}
      >
        {burst.length > 0 && (
          <span className="pointer-events-none absolute left-1/2 top-1/2">
            {burst.map((p, idx) => (
              <span
                key={`${task.id}-burst-${idx}`}
                className="coin-burst"
                style={{
                  ["--bx" as string]: `${p.x}px`,
                  ["--by" as string]: `${p.y}px`,
                  animationDelay: `${p.delay}s`,
                }}
              >
                <span className="coin-burst-inner">B</span>
              </span>
            ))}
          </span>
        )}
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
          {isDueSoon && (
            <span className="text-[11px] uppercase tracking-[0.2em] text-red-100 bg-red-600/60 border border-red-300/80 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(248,113,113,0.8)]">
              Bounty needed soon
            </span>
          )}
          {task.is_permanent && (
            <span className="text-[10px] uppercase tracking-wider text-blue-400">
              {getRepeatLabel(task) ?? "Permanent"}
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
