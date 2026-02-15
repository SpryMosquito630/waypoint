"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/game-store";
import { interpolateStormPosition, calculateStormSpeed } from "@/lib/game/storm";

/**
 * Client-side storm position interpolation.
 * Smoothly animates storm between server ticks (every 15 min).
 */
export function useStormMonitor() {
  const stormPosition = useGameStore((s) => s.stormPosition);
  const lastStormTick = useGameStore((s) => s.lastStormTick);
  const dailyTaskCount = useGameStore((s) => s.dailyTaskCount);
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);

  const [interpolated, setInterpolated] = useState(stormPosition);

  useEffect(() => {
    if (!lastStormTick) {
      setInterpolated(stormPosition);
      return;
    }

    const stormSpeed = calculateStormSpeed(dailyTaskCount);

    const interval = setInterval(() => {
      const secondsSince =
        (Date.now() - new Date(lastStormTick).getTime()) / 1000;
      const newPos = interpolateStormPosition(
        stormPosition,
        stormSpeed,
        secondsSince
      );
      // Don't let interpolation go past vehicle (server is authoritative for zap)
      setInterpolated(Math.min(newPos, vehiclePosition + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [stormPosition, lastStormTick, dailyTaskCount, vehiclePosition]);

  return interpolated;
}
