"use client";

import { useGameStore } from "@/stores/game-store";
import { VEHICLE_LEVELS } from "@/lib/game/constants";

export function Vehicle() {
  const vehicleLevel = useGameStore((s) => s.vehicleLevel);
  const currentVehicle = VEHICLE_LEVELS.findLast(
    (v) => vehicleLevel >= v.level
  ) ?? VEHICLE_LEVELS[0];

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Vehicle body */}
      <div className="w-16 h-10 relative">
        {/* Simple CSS vehicle since we don't have sprites yet */}
        <div className="absolute inset-0 bg-blue-500 rounded-t-lg rounded-b-sm shadow-lg shadow-blue-500/30">
          {/* Windshield */}
          <div className="absolute top-1 left-3 right-3 h-3 bg-blue-300/50 rounded-sm" />
          {/* Headlights */}
          <div className="absolute right-0 top-3 w-1.5 h-1.5 bg-blue-300 rounded-full" />
          <div className="absolute right-0 top-5 w-1.5 h-1.5 bg-blue-300 rounded-full" />
        </div>
        {/* Wheels */}
        <div className="absolute -bottom-1.5 left-1 w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600" />
        <div className="absolute -bottom-1.5 right-1 w-3 h-3 bg-zinc-800 rounded-full border border-zinc-600" />
      </div>
      {/* Vehicle name label */}
      <span className="text-[10px] text-blue-400/80 mt-1 font-medium whitespace-nowrap">
        {currentVehicle.name}
      </span>
    </div>
  );
}
