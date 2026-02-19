"use client";

import { useState } from "react";
import { useTaskStore } from "@/stores/task-store";
import { useTasks } from "@/hooks/use-tasks";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/button";
import { getDueAt, getReminderWindowMs, isRepeatDue } from "@/lib/tasks/repeat";

interface TaskListProps {
  playerId: string;
  mode?: "all" | "permanent";
}

export function TaskList({ playerId, mode = "all" }: TaskListProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const { createTask, completeTask, deleteTask } = useTasks(playerId);
  const [showForm, setShowForm] = useState(false);
  const [fadingIds, setFadingIds] = useState<string[]>([]);

  const now = new Date();
  const visibleTasks =
    mode === "permanent" ? tasks.filter((t) => t.is_permanent) : tasks;
  const fadeSet = new Set(fadingIds);
  const filteredTasks = visibleTasks.filter((t) => {
    if (!(t.is_permanent && t.status === "completed")) return true;
    if (isRepeatDue(t, now)) return true;
    const dueAt = getDueAt(t, now);
    if (!dueAt) return false;
    return dueAt.getTime() - now.getTime() <= getReminderWindowMs(t);
  });
  const pendingTasks = filteredTasks.filter(
    (t) => t.status === "pending" || fadeSet.has(t.id)
  );
  const completedTasks = filteredTasks.filter(
    (t) => t.status === "completed" && !fadeSet.has(t.id)
  );

  const startFade = (id: string) => {
    setFadingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.setTimeout(() => {
      setFadingIds((prev) => prev.filter((item) => item !== id));
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {mode === "permanent" ? "Permanent Tasks" : "Tasks"}
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
        >
          {showForm
            ? "Cancel"
            : mode === "permanent"
              ? "+ Add Permanent"
              : "+ Add Task"}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/80">
          <TaskForm
            onSubmit={async (data) => {
              const { error } = await createTask(data);
              if (!error) setShowForm(false);
              return { error: error?.message ?? null };
            }}
            onCancel={() => setShowForm(false)}
            defaultPermanent={mode === "permanent"}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-zinc-500">Loading tasks...</div>
      ) : (
        <>
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p>
                {mode === "permanent"
                  ? "No permanent tasks yet."
                  : "No tasks yet. Add one to start moving!"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={(id) => {
                  startFade(id);
                  completeTask(id);
                }}
                onDelete={deleteTask}
                isFading={fadeSet.has(task.id)}
              />
            ))}
          </div>

          {completedTasks.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </p>
              {completedTasks.slice(0, 5).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={(id) => {
                    startFade(id);
                    completeTask(id);
                  }}
                  onDelete={deleteTask}
                  isFading={fadeSet.has(task.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
