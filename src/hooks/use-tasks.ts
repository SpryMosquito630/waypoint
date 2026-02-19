"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTaskStore } from "@/stores/task-store";
import { useGameStore } from "@/stores/game-store";
import type { Task, TaskFormData } from "@/types/task";
import type { GameState } from "@/types/game";
import { isRepeatDue } from "@/lib/tasks/repeat";

const defaultRepeatAnchor = (intervalDays?: number) => {
  if (intervalDays === 1) return "time:08:00";
  if (intervalDays === 7) return "mon@08:00";
  if (intervalDays === 30) return "1@08:00";
  return null;
};

export function useTasks(playerId: string | null) {
  const { setTasks, addTask, updateTask, removeTask, setLoading, tasks } =
    useTaskStore();
  const syncFromDB = useGameStore((s) => s.syncFromDB);

  // Fetch tasks on mount
  useEffect(() => {
    if (!playerId) return;
    setLoading(true);

    const supabase = createClient();
    supabase
      .from("tasks")
      .select("*")
      .eq("player_id", playerId)
      .order("deadline", { ascending: true })
      .then(({ data }) => {
        if (data) setTasks(data as Task[]);
      });
  }, [playerId, setTasks, setLoading]);

  const createTask = useCallback(
    async (data: TaskFormData) => {
      if (!playerId) return;
      const supabase = createClient();
      const hasDeadline = !!data.deadline;
      const noDeadlineFallback = "2099-12-31T23:59:59.000Z";
      const insertPayload = {
        player_id: playerId,
        created_by: playerId,
        title: data.title,
        description: data.description || null,
        deadline: data.deadline || null,
        difficulty: data.difficulty,
        is_permanent: data.is_permanent,
        repeat_interval_days: data.is_permanent
          ? data.repeat_interval_days ?? 7
          : null,
        repeat_anchor: data.is_permanent
          ? data.repeat_anchor ?? defaultRepeatAnchor(data.repeat_interval_days)
          : null,
      };

      let { data: task, error } = await supabase
        .from("tasks")
        .insert(insertPayload)
        .select()
        .single();

      const missingColumn =
        !!error && error.message?.includes("is_permanent");
      const missingDeadline =
        !!error &&
        error.message?.includes('null value in column "deadline"');
      const missingRepeatInterval =
        !!error && error.message?.includes("repeat_interval_days");

      if (missingColumn && data.is_permanent) {
        return {
          task: null,
          error: {
            ...error,
            message:
              "Permanent tasks require the latest database migration. Apply migrations and try again.",
          },
        };
      }

      if (missingDeadline && !hasDeadline) {
        const { data: retryTask, error: retryError } = await supabase
          .from("tasks")
          .insert({
            player_id: playerId,
            created_by: playerId,
            title: data.title,
            description: data.description || null,
            deadline: noDeadlineFallback,
            difficulty: data.difficulty,
            is_permanent: data.is_permanent,
            repeat_interval_days: data.is_permanent
              ? data.repeat_interval_days ?? 7
              : null,
            repeat_anchor: data.is_permanent
              ? data.repeat_anchor ??
                defaultRepeatAnchor(data.repeat_interval_days)
              : null,
          })
          .select()
          .single();
        task = retryTask ?? null;
        error = retryError ?? null;
      }

      if (missingColumn && !data.is_permanent) {
        const { data: retryTask, error: retryError } = await supabase
          .from("tasks")
          .insert({
            player_id: playerId,
            created_by: playerId,
            title: data.title,
            description: data.description || null,
            deadline: data.deadline || (hasDeadline ? null : noDeadlineFallback),
            difficulty: data.difficulty,
          })
          .select()
          .single();
        task = retryTask ?? null;
        error = retryError ?? null;
      }

      if (missingRepeatInterval) {
        const { data: retryTask, error: retryError } = await supabase
          .from("tasks")
          .insert({
            player_id: playerId,
            created_by: playerId,
            title: data.title,
            description: data.description || null,
            deadline: data.deadline || (hasDeadline ? null : noDeadlineFallback),
            difficulty: data.difficulty,
            is_permanent: data.is_permanent,
            repeat_interval_days: data.is_permanent
              ? data.repeat_interval_days ?? 7
              : null,
            repeat_anchor: data.is_permanent
              ? data.repeat_anchor ??
                defaultRepeatAnchor(data.repeat_interval_days)
              : null,
          })
          .select()
          .single();
        task = retryTask ?? null;
        error = retryError ?? null;
      }

      if (task && !error) addTask(task as Task);
      return { task, error };
    },
    [playerId, addTask]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (!error) {
        updateTask(taskId, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });

        if (playerId) {
          const { data: gameState } = await supabase
            .from("game_state")
            .select("*")
            .eq("player_id", playerId)
            .single();
          if (gameState) {
            syncFromDB(gameState as GameState);
          }
        }
      }
      return { error };
    },
    [playerId, syncFromDB, updateTask]
  );

  useEffect(() => {
    if (!playerId || tasks.length === 0) return;
    const supabase = createClient();

    const refresh = async () => {
      const now = new Date();
      const due = tasks.filter(
        (t) => t.is_permanent && t.status === "completed" && isRepeatDue(t, now)
      );
      if (due.length === 0) return;
      for (const task of due) {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "pending" })
          .eq("id", task.id);
        if (!error) {
          updateTask(task.id, { status: "pending" });
        }
      }
    };

    refresh();
    const id = setInterval(refresh, 60 * 1000);
    return () => clearInterval(id);
  }, [playerId, tasks, updateTask]);

  const deleteTask = useCallback(
    async (taskId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (!error) removeTask(taskId);
      return { error };
    },
    [removeTask]
  );

  return { createTask, completeTask, deleteTask };
}
