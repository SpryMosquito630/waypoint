"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTaskStore } from "@/stores/task-store";
import { useGameStore } from "@/stores/game-store";
import type { Task, TaskFormData } from "@/types/task";
import type { GameState } from "@/types/game";

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

        const task = tasks.find((t) => t.id === taskId);
        if (task?.is_permanent) {
          await supabase
            .from("tasks")
            .update({
              status: "pending",
              completed_at: null,
            })
            .eq("id", taskId);
          updateTask(taskId, {
            status: "pending",
            completed_at: null,
          });
        }

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
    [playerId, syncFromDB, tasks, updateTask]
  );

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
