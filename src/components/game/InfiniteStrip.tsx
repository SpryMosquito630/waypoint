"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import { Vehicle } from "./Vehicle";
import { StormFront } from "./StormFront";
import {
  TILE_WIDTH_PX,
  MOVE_ANIMATION_DURATION,
  TILES_AHEAD,
  TILES_BEHIND,
} from "@/lib/game/constants";
import { generateTile, generateTileWindow } from "@/lib/game/engine";
import type { Tile } from "@/types/game";

const biomeColors: Record<string, string> = {
  desert: "bg-blue-950/40",
  forest: "bg-green-950/40",
  tundra: "bg-blue-950/40",
};

const biomeGroundColors: Record<string, string> = {
  desert: "bg-blue-800/60",
  forest: "bg-green-800/60",
  tundra: "bg-slate-700/60",
};

function TileElement({
  tile,
  highlight,
}: {
  tile: Tile;
  highlight: boolean;
}) {
  return (
    <div
      className={`flex-shrink-0 h-full flex flex-col items-center justify-end relative ${biomeColors[tile.biome]}`}
      style={{ width: TILE_WIDTH_PX }}
    >
      {highlight && (
        <div className="absolute inset-0 border-2 border-blue-400/80 rounded-md shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
      )}

      {/* Tile content */}
      {tile.type === "crate" && (
        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-700 border-2 border-blue-500 rounded-sm flex items-center justify-center text-xs font-bold text-blue-200 shadow-lg shadow-blue-500/20">
          ?
        </div>
      )}
      {tile.type === "milestone" && (
        <div className="absolute top-1/2 -translate-y-1/2 w-1 h-12 bg-zinc-500">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 whitespace-nowrap">
            {tile.index}
          </div>
        </div>
      )}

      {/* Ground */}
      <div className={`w-full h-3 ${biomeGroundColors[tile.biome]}`} />

      {/* Road line */}
      <div className="absolute bottom-3 w-full h-0.5 bg-zinc-600/30" />

      {/* Tile border */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-zinc-800/30" />
    </div>
  );
}

export function InfiniteStrip() {
  const tiles = useGameStore((s) => s.tiles);
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);
  const playerSeed = useGameStore((s) => s.playerSeed);
  const hasSynced = useGameStore((s) => s.hasSynced);
  const [lookAheadIndex, setLookAheadIndex] = useState<number | null>(null);
  const [aheadError, setAheadError] = useState<string | null>(null);
  const [moveTick, setMoveTick] = useState(0);
  const [moveDir, setMoveDir] = useState<"forward" | "back" | null>(null);
  const [moveDistance, setMoveDistance] = useState(0);
  const [moveDuration, setMoveDuration] = useState(MOVE_ANIMATION_DURATION);
  const [stripDuration, setStripDuration] = useState(MOVE_ANIMATION_DURATION);
  const [stripEase, setStripEase] = useState<"linear" | "easeInOut">(
    "easeInOut"
  );
  const [carPhase, setCarPhase] = useState<"idle" | "move" | "reset">("idle");
  const prevCenterRef = useRef<number | null>(null);
  const suppressMoveRef = useRef(true);

  const MAX_LOOKAHEAD = 500;
  const MAX_LOOKBACK = 500;

  const viewCenter = lookAheadIndex ?? vehiclePosition;
  const visibleTiles = useMemo(() => {
    if (lookAheadIndex === null) return tiles;
    return generateTileWindow(viewCenter, TILES_BEHIND, TILES_AHEAD, playerSeed);
  }, [lookAheadIndex, viewCenter, playerSeed, tiles]);

  // Calculate offset so the vehicle stays centered
  const firstTileIndex = visibleTiles.length > 0 ? visibleTiles[0].index : 0;
  const vehicleOffset = viewCenter - firstTileIndex;
  const stripOffset = -(vehicleOffset * TILE_WIDTH_PX);

  useEffect(() => {
    if (prevCenterRef.current === null) {
      prevCenterRef.current = viewCenter;
      return;
    }
    if (hasSynced && suppressMoveRef.current) {
      prevCenterRef.current = viewCenter;
      suppressMoveRef.current = false;
      return;
    }
    const delta = viewCenter - prevCenterRef.current;
    if (delta !== 0) {
      const tilesMoved = Math.abs(delta);
      const distance = Math.min(tilesMoved, 8) * (TILE_WIDTH_PX * 0.35);
      const rewardMode = lookAheadIndex !== null;
      const duration = rewardMode
        ? Math.min(12, Math.max(5, tilesMoved * 0.25))
        : Math.min(2.4, MOVE_ANIMATION_DURATION + tilesMoved * 0.12);
      setMoveDir(delta > 0 ? "forward" : "back");
      setMoveDistance(distance);
      setMoveDuration(duration);
      setStripDuration(duration);
      setStripEase(rewardMode ? "linear" : "easeInOut");
      setMoveTick((t) => t + 1);
      setCarPhase("move");
    }
    prevCenterRef.current = viewCenter;
  }, [viewCenter]);

  const findNextCrate = (fromIndex: number) => {
    for (let i = fromIndex + 1; i <= fromIndex + MAX_LOOKAHEAD; i++) {
      if (generateTile(i, playerSeed).type === "crate") return i;
    }
    return null;
  };

  const findPrevCrate = (fromIndex: number) => {
    const start = Math.max(0, fromIndex - MAX_LOOKBACK);
    for (let i = fromIndex - 1; i >= start; i--) {
      if (generateTile(i, playerSeed).type === "crate") return i;
    }
    return null;
  };

  const handleAheadClick = () => {
    const base = lookAheadIndex ?? vehiclePosition;
    const next = findNextCrate(base);
    if (next === null) {
      setAheadError(`No rewards within ${MAX_LOOKAHEAD} tiles.`);
      return;
    }
    setAheadError(null);
    setLookAheadIndex(next);
  };

  const handleBackClick = () => {
    const base = lookAheadIndex ?? vehiclePosition;
    const prev = findPrevCrate(base);
    if (prev === null) {
      setAheadError(`No rewards within ${MAX_LOOKBACK} tiles.`);
      return;
    }
    setAheadError(null);
    setLookAheadIndex(prev);
  };

  const handleReturnClick = () => {
    setAheadError(null);
    setLookAheadIndex(null);
  };

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      {/* Sky gradient (changes by biome of current tile) */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950" />

      {/* Storm overlay */}
      <StormFront />

      {/* Scrolling tile strip */}
      <motion.div
        className="absolute bottom-0 flex h-full items-end"
        animate={{ x: stripOffset }}
        transition={{
          duration: stripDuration,
          ease: stripEase,
        }}
        style={{
          left: "50%",
          marginLeft: -(TILE_WIDTH_PX / 2),
        }}
      >
        {visibleTiles.map((tile) => (
          <TileElement
            key={tile.index}
            tile={tile}
            highlight={lookAheadIndex === tile.index}
          />
        ))}
      </motion.div>

      {/* Vehicle (fixed at center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <motion.div
          key={moveTick}
          initial={false}
          animate={
            moveDir
              ? {
                  x:
                    carPhase === "move"
                      ? moveDir === "forward"
                        ? moveDistance
                        : -moveDistance
                      : 0,
                  y: carPhase === "move" ? -6 : 0,
                }
              : { x: 0, y: 0 }
          }
          transition={{
            duration: carPhase === "reset" ? 0 : moveDuration,
            ease: stripEase,
          }}
          onAnimationComplete={() => {
            if (carPhase === "move") {
              setCarPhase("reset");
            } else if (carPhase === "reset") {
              setCarPhase("idle");
            }
          }}
        >
          <Vehicle isMoving={carPhase === "move"} />
        </motion.div>
      </div>

      {/* Look-ahead arrow */}
      <button
        type="button"
        onClick={handleAheadClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 text-blue-300/80 hover:text-blue-200 transition-colors"
      >
        <span className="text-xs uppercase tracking-wider">Ahead</span>
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleBackClick}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 text-blue-300/80 hover:text-blue-200 transition-colors"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M11 19l-7-7 7-7" />
        </svg>
        <span className="text-xs uppercase tracking-wider">Back</span>
      </button>

      <button
        type="button"
        onClick={handleReturnClick}
        className="absolute left-1/2 bottom-2 -translate-x-1/2 z-40 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-200 hover:bg-blue-500/20 transition-colors"
      >
        Return
      </button>

      {(lookAheadIndex !== null || aheadError) && (
        <div className="absolute right-3 top-6 z-40 text-[10px] text-blue-200/80">
          {aheadError
            ? aheadError
            : `Reward at tile ${lookAheadIndex}`}
        </div>
      )}

      {/* Vignette edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent" />
      </div>
    </div>
  );
}
