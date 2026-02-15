import type { LootResult } from "@/types/game";
import { mulberry32 } from "./prng";
import { LOOT_TABLE, IRL_TICKETS } from "./constants";

/**
 * Roll a loot reward from the loot table.
 * Uses a deterministic seed (tileIndex + playerSeed) to prevent refresh exploits.
 */
export function rollLoot(tileIndex: number, playerSeed: number): LootResult {
  const rng = mulberry32(playerSeed + tileIndex * 13397);
  const roll = rng() * 100;

  let cumulative = 0;
  for (const entry of LOOT_TABLE) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return { type: entry.type, label: entry.label };
    }
  }

  return { type: "scrap", label: "Scrap Metal" };
}

/**
 * Pick a random IRL ticket description based on tile + player seed.
 */
export function pickTicketDescription(
  tileIndex: number,
  playerSeed: number
): string {
  const rng = mulberry32(playerSeed + tileIndex * 17389);
  const idx = Math.floor(rng() * IRL_TICKETS.length);
  return IRL_TICKETS[idx];
}
