"use client";

import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";

interface TasksClientProps {
  userId: string;
}

export function TasksClient({ userId }: TasksClientProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-500">Tasks</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/tasks/permanent"
              className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              Permanent Tasks
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <TaskList playerId={userId} />
      </main>
    </div>
  );
}
