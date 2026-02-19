"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { useTaskStore } from "@/stores/task-store";
import { useGameStore } from "@/stores/game-store";
import { useTasks } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { Task } from "@/types/task";
import {
  getRepeatLabel,
  getDueAt,
  getReminderWindowMs,
  isRepeatDue,
} from "@/lib/tasks/repeat";

const difficultyLabels = ["", "Easy", "Medium", "Hard"] as const;

function BountyPoster({
  task,
  onComplete,
  onDelete,
  isFading,
  theme,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isFading: boolean;
  theme: "standard" | "neon" | "royal";
}) {
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
      className={`bounty-poster ${theme} ${isCompleted ? "opacity-60" : ""} ${
        isFading ? "task-fade-out" : ""
      }`}
    >
      <div className="bounty-poster-inner">
        <p className="bounty-title">Wanted</p>
        <p className="bounty-name">{task.title}</p>
        {task.description && (
          <p className="bounty-desc">{task.description}</p>
        )}

        <div className="bounty-meta">
          <span>
            Reward +{task.difficulty} {difficultyLabels[task.difficulty]}
          </span>
          <span>
            {isNoDeadline
              ? "No deadline"
              : `Due ${format(new Date(task.deadline!), "MMM d, h:mm a")}`}
          </span>
          {isDueSoon && (
            <span className="text-[11px] uppercase tracking-[0.2em] text-red-100 bg-red-600/60 border border-red-300/80 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(248,113,113,0.8)]">
              Bounty needed soon
            </span>
          )}
          {task.is_permanent && <span>{getRepeatLabel(task) ?? "Permanent"}</span>}
        </div>

        <div className="bounty-actions">
          <button
            onClick={() => {
              if (isCompleted) return;
              triggerBurst();
              onComplete(task.id);
            }}
            disabled={isCompleted || isFading}
            className="bounty-btn relative overflow-visible"
          >
            {isCompleted ? "Claimed" : "Claim"}
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
          </button>
          {!isCompleted && (
            <button
              onClick={() => onDelete(task.id)}
              className="bounty-btn ghost"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BountyBoard({ playerId }: { playerId: string }) {
  const tasks = useTaskStore((s) => s.tasks);
  const coinCount = useGameStore((s) => s.coinCount);
  const silverCount = useGameStore((s) => s.silverCount);
  const goldCount = useGameStore((s) => s.goldCount);
  const { createTask, completeTask, deleteTask } = useTasks(playerId);
  const [showForm, setShowForm] = useState(false);
  const [fadingIds, setFadingIds] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(1);
  const [activeTheme, setActiveTheme] = useState<"standard" | "neon" | "royal">(
    "standard"
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("activeTheme");
    if (stored === "neon" || stored === "royal" || stored === "standard") {
      setActiveTheme(stored);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");
    const yesterdayKey = format(subDays(now, 1), "yyyy-MM-dd");
    const storedStreak = Number(window.localStorage.getItem("streakCount") ?? "0");
    const storedLast = window.localStorage.getItem("lastLoginDate");
    let nextStreak = storedStreak > 0 ? storedStreak : 1;

    let lastDate: Date | null = null;
    if (storedLast) {
      const parsed = new Date(storedLast);
      if (!Number.isNaN(parsed.getTime())) lastDate = parsed;
    }

    if (!lastDate) {
      nextStreak = 1;
    } else {
      const lastKey = format(lastDate, "yyyy-MM-dd");
      const diffMs = now.getTime() - lastDate.getTime();
      if (lastKey === yesterdayKey) {
        nextStreak = (storedStreak > 0 ? storedStreak : 1) + 1;
      } else if (diffMs > 48 * 60 * 60 * 1000) {
        nextStreak = 1;
      }
    }

    window.localStorage.setItem("lastLoginDate", now.toISOString());
    window.localStorage.setItem("streakCount", String(nextStreak));
    setStreakCount(nextStreak);
  }, []);

  const fadeSet = useMemo(() => new Set(fadingIds), [fadingIds]);

  const { pending, completed, permanent } = useMemo(() => {
    const now = new Date();
    const visible = tasks.filter((t) => {
      if (!(t.is_permanent && t.status === "completed")) return true;
      if (isRepeatDue(t, now)) return true;
      const dueAt = getDueAt(t, now);
      if (!dueAt) return false;
      return dueAt.getTime() - now.getTime() <= getReminderWindowMs(t);
    });
    return {
      pending: visible.filter(
        (t) => t.status === "pending" || fadeSet.has(t.id)
      ),
      completed: visible.filter(
        (t) => t.status === "completed" && !fadeSet.has(t.id)
      ),
      permanent: visible.filter((t) => t.is_permanent).length,
    };
  }, [tasks, fadeSet]);

  const startFade = (id: string) => {
    setFadingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.setTimeout(() => {
      setFadingIds((prev) => prev.filter((item) => item !== id));
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-900/30 via-zinc-900/80 to-zinc-950 p-4 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">
              Bounty Board
            </p>
            <h2 className="text-xl font-semibold text-amber-100">
              Choose a bounty and collect rewards
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
              Bronze coins: {coinCount}
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              Silver: {silverCount}
            </div>
            <div className="rounded-full border border-yellow-300/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-100">
              Gold: {goldCount}
            </div>
            <Link
              href="/shop"
              className="text-sm rounded-full border border-amber-300/40 bg-amber-500/20 px-5 py-2 text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Shop
            </Link>
          </div>
        </div>

        <div className="mt-3">
          <Link
            href="/non-active"
            className="text-xs rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-amber-100 hover:bg-amber-500/20 transition-colors"
          >
            Non-active tasks
          </Link>
          <Link
            href="/trading"
            className="ml-2 text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 hover:bg-white/20 transition-colors"
          >
            Trading Hub
          </Link>
        </div>

        <p className="mt-2 text-sm text-amber-100/70">
          Complete tasks to earn scrap, boosts, and tickets.
        </p>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-amber-200/80">
          <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2.5 py-1">
            Pending {pending.length}
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2.5 py-1">
            Completed {completed.length}
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-2.5 py-1">
            Permanent {permanent}
          </span>
        </div>

        <div className="streak-indicator" aria-label="Daily streak">
          <span className="streak-flame-wrap">
            <span className="streak-flame" role="img" aria-hidden="true">
              🔥
            </span>
            <span className="streak-count">{streakCount}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-widest text-amber-200/80">
          Active Bounties
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-amber-100 hover:bg-amber-500/20 transition-colors"
        >
          {showForm ? "Close" : "+ Add Bounty"}
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-lg border border-amber-400/20 bg-amber-950/40">
          <TaskForm
            onSubmit={async (data) => {
              const { error } = await createTask(data);
              if (!error) setShowForm(false);
              return { error: error?.message ?? null };
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {pending.length === 0 ? (
        <div className="text-center py-10 text-amber-200/70">
          No active bounties. Add one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((task) => (
            <BountyPoster
              key={task.id}
              task={task}
              onComplete={(id) => {
                startFade(id);
                completeTask(id);
              }}
              onDelete={deleteTask}
              isFading={fadeSet.has(task.id)}
              theme={activeTheme}
            />
          ))}
        </div>
      )}

      {/* Completed bounties hidden in active view */}

    </div>
  );
}
