"use client";

import { useState } from "react";
import { useTaskStore } from "@/stores/task-store";
import { useTasks } from "@/hooks/use-tasks";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/button";

interface TaskListProps {
  playerId: string;
  mode?: "all" | "permanent";
}

export function TaskList({ playerId, mode = "all" }: TaskListProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const isLoading = useTaskStore((s) => s.isLoading);
  const { createTask, completeTask, deleteTask } = useTasks(playerId);
  const [showForm, setShowForm] = useState(false);

  const visibleTasks =
    mode === "permanent" ? tasks.filter((t) => t.is_permanent) : tasks;
  const pendingTasks = visibleTasks.filter((t) => t.status === "pending");
  const completedTasks = visibleTasks.filter((t) => t.status === "completed");

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
                onComplete={completeTask}
                onDelete={deleteTask}
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
                  onComplete={completeTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
