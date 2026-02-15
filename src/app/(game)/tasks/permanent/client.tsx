"use client";

import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";

interface PermanentTasksClientProps {
  userId: string;
}

export function PermanentTasksClient({ userId }: PermanentTasksClientProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-500">Permanent Tasks</h1>
          <Link
            href="/tasks"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to Tasks
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <TaskList playerId={userId} mode="permanent" />
      </main>
    </div>
  );
}
