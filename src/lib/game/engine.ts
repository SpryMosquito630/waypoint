import type { Tile, BiomeType } from "@/types/game";
import { mulberry32, hashString } from "./prng";
import {
  BIOMES,
  BIOME_LENGTH,
  CRATE_CHANCE,
  MILESTONE_INTERVAL,
} from "./constants";

/**
 * Generate a single tile deterministically based on player seed and tile index.
 */
export function generateTile(index: number, playerSeed: number): Tile {
  const rng = mulberry32(playerSeed + index * 7919); // prime multiplier for better spread
  const roll = rng();

  const biome: BiomeType = BIOMES[Math.floor(index / BIOME_LENGTH) % BIOMES.length];

  let type: Tile["type"] = "road";
  if (index > 0 && index % MILESTONE_INTERVAL === 0) {
    type = "milestone";
  } else if (roll < CRATE_CHANCE) {
    type = "crate";
  }

  return { index, type, biome };
}

/**
 * Generate a window of tiles around a position.
 */
export function generateTileWindow(
  centerIndex: number,
  behind: number,
  ahead: number,
  playerSeed: number
): Tile[] {
  const start = Math.max(0, centerIndex - behind);
  const end = centerIndex + ahead;
  const tiles: Tile[] = [];

  for (let i = start; i <= end; i++) {
    tiles.push(generateTile(i, playerSeed));
  }

  return tiles;
}

/**
 * Get the player seed from their user ID.
 */
export function getPlayerSeed(playerId: string): number {
  return hashString(playerId);
}

/**
 * Find crate tiles in a range of tile indices.
 */
export function findCratesInRange(
  fromIndex: number,
  toIndex: number,
  playerSeed: number
): Tile[] {
  const crates: Tile[] = [];
  for (let i = fromIndex + 1; i <= toIndex; i++) {
    const tile = generateTile(i, playerSeed);
    if (tile.type === "crate") {
      crates.push(tile);
    }
  }
  return crates;
}
