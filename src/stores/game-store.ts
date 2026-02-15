"use client";

import { create } from "zustand";
import type { GameState, Tile, AnimationEvent } from "@/types/game";
import { generateTileWindow, getPlayerSeed } from "@/lib/game/engine";
import { TILES_BEHIND, TILES_AHEAD, VEHICLE_LEVELS } from "@/lib/game/constants";

interface GameStore {
  // Mirrored from DB
  vehiclePosition: number;
  stormPosition: number;
  vehicleLevel: number;
  totalDistance: number;
  scrapCount: number;
  boostCount: number;
  dailyTaskCount: number;
  lastStormTick: string | null;
  currentStreak: number;
  weekStartPosition: number;

  // Client-only
  playerId: string | null;
  playerSeed: number;
  tiles: Tile[];
  animationQueue: AnimationEvent[];
  isAnimating: boolean;

  // Actions
  setPlayer: (playerId: string) => void;
  syncFromDB: (state: GameState) => void;
  regenerateTiles: () => void;
  enqueueAnimation: (event: AnimationEvent) => void;
  dequeueAnimation: () => AnimationEvent | undefined;
  setAnimating: (animating: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // DB-mirrored state
  vehiclePosition: 0,
  stormPosition: 0,
  vehicleLevel: 1,
  totalDistance: 0,
  scrapCount: 0,
  boostCount: 0,
  dailyTaskCount: 0,
  lastStormTick: null,
  currentStreak: 0,
  weekStartPosition: 0,

  // Client state
  playerId: null,
  playerSeed: 0,
  tiles: [],
  animationQueue: [],
  isAnimating: false,

  setPlayer: (playerId: string) => {
    const seed = getPlayerSeed(playerId);
    set({ playerId, playerSeed: seed });
  },

  syncFromDB: (dbState: GameState) => {
    const prev = get();
    const positionChanged = dbState.vehicle_position !== prev.vehiclePosition;
    const levelChanged = dbState.vehicle_level !== prev.vehicleLevel;

    set({
      vehiclePosition: dbState.vehicle_position,
      stormPosition: dbState.storm_position,
      vehicleLevel: dbState.vehicle_level,
      totalDistance: dbState.total_distance,
      scrapCount: dbState.scrap_count,
      boostCount: dbState.boost_count,
      dailyTaskCount: dbState.daily_task_count,
      lastStormTick: dbState.last_storm_tick,
      currentStreak: dbState.current_streak,
      weekStartPosition: dbState.week_start_position,
    });

    // Enqueue movement animation if position changed
    if (positionChanged && prev.playerId) {
      get().enqueueAnimation({
        type: "move",
        payload: {
          fromPosition: prev.vehiclePosition,
          toPosition: dbState.vehicle_position,
        },
      });
    }

    // Enqueue evolution animation if level changed
    if (levelChanged) {
      const newLevel = VEHICLE_LEVELS.find(
        (v) => v.level === dbState.vehicle_level
      );
      if (newLevel) {
        get().enqueueAnimation({
          type: "evolve",
          payload: { newLevel },
        });
      }
    }

    // Regenerate visible tiles
    get().regenerateTiles();
  },

  regenerateTiles: () => {
    const { vehiclePosition, playerSeed } = get();
    const tiles = generateTileWindow(
      vehiclePosition,
      TILES_BEHIND,
      TILES_AHEAD,
      playerSeed
    );
    set({ tiles });
  },

  enqueueAnimation: (event: AnimationEvent) => {
    set((s) => ({ animationQueue: [...s.animationQueue, event] }));
  },

  dequeueAnimation: () => {
    const queue = get().animationQueue;
    if (queue.length === 0) return undefined;
    const [next, ...rest] = queue;
    set({ animationQueue: rest });
    return next;
  },

  setAnimating: (animating: boolean) => {
    set({ isAnimating: animating });
  },
}));
