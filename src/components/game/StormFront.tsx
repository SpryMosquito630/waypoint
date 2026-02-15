"use client";

import { useStormMonitor } from "@/hooks/use-storm-monitor";
import { useGameStore } from "@/stores/game-store";
import { TILE_WIDTH_PX } from "@/lib/game/constants";

export function StormFront() {
  const interpolatedStorm = useStormMonitor();
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);
  const gap = vehiclePosition - Math.floor(interpolatedStorm);

  // Storm position relative to vehicle (in pixels)
  const stormOffset = (interpolatedStorm - vehiclePosition) * TILE_WIDTH_PX;

  return (
    <div
      className="absolute top-0 bottom-0 z-20 pointer-events-none"
      style={{
        right: `calc(50% - ${stormOffset}px)`,
        width: "200vw",
        transform: "translateX(-100%)",
      }}
    >
      {/* Storm gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/70 to-transparent">
        {/* Lightning flickers */}
        <div className="absolute right-4 top-1/4 w-0.5 h-8 bg-purple-300/60 animate-pulse" />
        <div className="absolute right-12 top-1/2 w-0.5 h-6 bg-purple-300/40 animate-pulse [animation-delay:0.5s]" />
        <div className="absolute right-8 top-3/4 w-0.5 h-10 bg-purple-300/50 animate-pulse [animation-delay:1s]" />
      </div>

      {/* Storm edge glow */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-purple-500/30" />

      {/* Gap indicator */}
      {gap <= 5 && (
        <div className="absolute right-2 top-2 text-xs font-bold text-red-400 animate-pulse">
          {gap <= 0 ? "ZAP!" : `${gap} tiles!`}
        </div>
      )}
    </div>
  );
}
