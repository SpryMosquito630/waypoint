import type { VehicleLevel } from "@/types/game";

// Storm tuning
export const STORM_BASE_SPEED = 1; // tiles per hour
export const STORM_TASK_WEIGHT = 0.5; // additional tiles/hour per pending task
export const STORM_TICK_INTERVAL_MINUTES = 15;
export const STORM_WARNING_THRESHOLD = 3; // tiles gap before warning

// Tile generation
export const CRATE_CHANCE = 0.15; // 15% chance per tile
export const MILESTONE_INTERVAL = 7; // milestone every 7th tile
export const BIOME_LENGTH = 50; // tiles per biome
export const BIOMES = ["desert", "forest", "tundra"] as const;

// Rendering
export const TILE_WIDTH_PX = 120;
export const TILES_BEHIND = 20;
export const TILES_AHEAD = 30;
export const MOVE_ANIMATION_DURATION = 0.8; // seconds

// Loot table
export const LOOT_TABLE = [
  { type: "scrap" as const, weight: 60, label: "Scrap Metal" },
  { type: "boost" as const, weight: 30, label: "Speed Boost" },
  { type: "irl_ticket" as const, weight: 10, label: "IRL Ticket" },
];

// Vehicle evolution
export const VEHICLE_LEVELS: VehicleLevel[] = [
  { level: 1, minDistance: 0, sprite: "/sprites/vehicle-l1.png", name: "Rust Bucket" },
  { level: 10, minDistance: 100, sprite: "/sprites/vehicle-l10.png", name: "Road Runner" },
  { level: 50, minDistance: 500, sprite: "/sprites/vehicle-l50.png", name: "Storm Chaser" },
];

// IRL Ticket descriptions (randomly selected)
export const IRL_TICKETS = [
  "30 min extra screen time",
  "Pick what's for dinner",
  "Stay up 30 min later",
  "Skip one chore",
  "Choose a family activity",
];

// Weekly checkpoint
export const WEEKLY_CHECKPOINT_TILES = 50; // tiles needed per week
