import { STORM_BASE_SPEED, STORM_TASK_WEIGHT } from "./constants";

/**
 * Calculate storm speed in tiles per hour based on daily task count.
 */
export function calculateStormSpeed(dailyTaskCount: number): number {
  return STORM_BASE_SPEED + dailyTaskCount * STORM_TASK_WEIGHT;
}

/**
 * Calculate interpolated storm position between server ticks.
 * Used for smooth client-side rendering.
 */
export function interpolateStormPosition(
  lastKnownPosition: number,
  stormSpeed: number,
  secondsSinceLastTick: number
): number {
  return lastKnownPosition + (stormSpeed * secondsSinceLastTick) / 3600;
}

/**
 * Check if the storm has caught the vehicle.
 */
export function isZapped(
  vehiclePosition: number,
  stormPosition: number
): boolean {
  return stormPosition >= vehiclePosition;
}

/**
 * Get the gap between vehicle and storm.
 */
export function getStormGap(
  vehiclePosition: number,
  stormPosition: number
): number {
  return vehiclePosition - stormPosition;
}
