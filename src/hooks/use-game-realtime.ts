"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/stores/game-store";
import type { GameState } from "@/types/game";

export function useGameRealtime(playerId: string | null) {
  const syncFromDB = useGameStore((s) => s.syncFromDB);
  const setPlayer = useGameStore((s) => s.setPlayer);

  useEffect(() => {
    if (!playerId) return;

    setPlayer(playerId);
    const supabase = createClient();

    // Fetch initial state
    supabase
      .from("game_state")
      .select("*")
      .eq("player_id", playerId)
      .single()
      .then(({ data }) => {
        if (data) syncFromDB(data as GameState);
      });

    // Subscribe to changes
    const channel = supabase
      .channel(`game_state:${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          syncFromDB(payload.new as GameState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, syncFromDB, setPlayer]);
}
