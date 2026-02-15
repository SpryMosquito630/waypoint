"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGameRealtime } from "@/hooks/use-game-realtime";
import { useGameStore } from "@/stores/game-store";
import { findCratesInRange } from "@/lib/game/engine";
import { InfiniteStrip } from "@/components/game/InfiniteStrip";
import { ProgressBar } from "@/components/game/ProgressBar";
import { CrateReveal } from "@/components/game/CrateReveal";
import { TaskList } from "@/components/tasks/TaskList";
import type { GameState, LootResult } from "@/types/game";

interface DashboardClientProps {
  userId: string;
  displayName: string;
  role: string;
  inviteCode: string | null;
}

export function DashboardClient({
  userId,
  displayName,
  role,
  inviteCode,
}: DashboardClientProps) {
  const router = useRouter();
  const scrapCount = useGameStore((s) => s.scrapCount);
  const boostCount = useGameStore((s) => s.boostCount);
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);
  const totalDistance = useGameStore((s) => s.totalDistance);
  const playerSeed = useGameStore((s) => s.playerSeed);
  const syncFromDB = useGameStore((s) => s.syncFromDB);
  const [crateReward, setCrateReward] = useState<LootResult | null>(null);
  const [rewardQueue, setRewardQueue] = useState<LootResult[]>([]);
  const prevPositionRef = useRef<number | null>(null);

  // Subscribe to realtime game state
  useGameRealtime(userId);

  const claimCrate = useCallback(
    async (tileIndex: number) => {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileIndex }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        reward?: LootResult;
        gameState?: GameState;
      };
      if (data.gameState) {
        syncFromDB(data.gameState);
      }
      return data.reward ?? null;
    },
    [syncFromDB]
  );

  useEffect(() => {
    if (prevPositionRef.current === null) {
      prevPositionRef.current = vehiclePosition;
      return;
    }

    const prev = prevPositionRef.current;
    if (vehiclePosition <= prev) {
      prevPositionRef.current = vehiclePosition;
      return;
    }

    const crates = findCratesInRange(prev, vehiclePosition, playerSeed);
    prevPositionRef.current = vehiclePosition;
    if (crates.length === 0) return;

    let cancelled = false;
    (async () => {
      const rewards: LootResult[] = [];
      for (const crate of crates) {
        const reward = await claimCrate(crate.index);
        if (reward) rewards.push(reward);
      }
      if (!cancelled && rewards.length > 0) {
        setRewardQueue((q) => [...q, ...rewards]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vehiclePosition, playerSeed, claimCrate]);

  useEffect(() => {
    if (crateReward || rewardQueue.length === 0) return;
    setCrateReward(rewardQueue[0]);
    setRewardQueue((q) => q.slice(1));
  }, [crateReward, rewardQueue]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Bar */}
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-blue-500">Waypoint AI</h1>
            <span className="text-sm text-zinc-400">{displayName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/rewards"
                className="text-zinc-400 hover:text-blue-300 transition-colors"
              >
                <span className="text-blue-400 font-medium">
                  {scrapCount + boostCount}
                </span>{" "}
                Rewards
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Game Strip */}
        <InfiniteStrip />

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Position: {vehiclePosition}</span>
          <span>Total distance: {totalDistance}</span>
        </div>

        {/* Weekly progress */}
        <ProgressBar />

        {/* Parent invite code (if role is parent) */}
        {role === "parent" && inviteCode && (
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900">
            <p className="text-xs text-zinc-500 mb-1">Your invite code</p>
            <p className="text-lg font-mono font-bold text-blue-400 tracking-widest">
              {inviteCode}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Share this with your child to link accounts
            </p>
          </div>
        )}

        {/* Task List */}
        <TaskList playerId={userId} />
      </main>

      {/* Crate reveal overlay */}
      <CrateReveal
        reward={crateReward}
        onClose={() => setCrateReward(null)}
      />
    </div>
  );
}
