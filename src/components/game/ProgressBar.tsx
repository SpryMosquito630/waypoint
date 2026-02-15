"use client";

import { useGameStore } from "@/stores/game-store";
import { WEEKLY_CHECKPOINT_TILES } from "@/lib/game/constants";

export function ProgressBar() {
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);
  const weekStartPosition = useGameStore((s) => s.weekStartPosition);

  const progress = vehiclePosition - weekStartPosition;
  const percentage = Math.min(
    100,
    (progress / WEEKLY_CHECKPOINT_TILES) * 100
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">Weekly Checkpoint</span>
        <span className="text-zinc-500">
          {progress}/{WEEKLY_CHECKPOINT_TILES} tiles
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
