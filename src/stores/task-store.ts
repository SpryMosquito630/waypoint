"use client";

import { create } from "zustand";
import type { Task } from "@/types/task";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: true,

  setTasks: (tasks: Task[]) => set({ tasks, isLoading: false }),

  addTask: (task: Task) =>
    set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id: string, updates: Partial<Task>) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id: string) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
