"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/stores/game-store";
import { Vehicle } from "./Vehicle";
import { StormFront } from "./StormFront";
import { TILE_WIDTH_PX, MOVE_ANIMATION_DURATION } from "@/lib/game/constants";
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

function TileElement({ tile }: { tile: Tile }) {
  return (
    <div
      className={`flex-shrink-0 h-full flex flex-col items-center justify-end relative ${biomeColors[tile.biome]}`}
      style={{ width: TILE_WIDTH_PX }}
    >
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

  // Calculate offset so the vehicle stays centered
  const firstTileIndex = tiles.length > 0 ? tiles[0].index : 0;
  const vehicleOffset = vehiclePosition - firstTileIndex;
  const stripOffset = -(vehicleOffset * TILE_WIDTH_PX);

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
          duration: MOVE_ANIMATION_DURATION,
          ease: "easeInOut",
        }}
        style={{
          left: "50%",
          marginLeft: -(TILE_WIDTH_PX / 2),
        }}
      >
        {tiles.map((tile) => (
          <TileElement key={tile.index} tile={tile} />
        ))}
      </motion.div>

      {/* Vehicle (fixed at center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Vehicle />
      </div>

      {/* Look-ahead arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 text-blue-300/80">
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
      </div>

      {/* Vignette edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent" />
      </div>
    </div>
  );
}
