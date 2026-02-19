export type BiomeType = "desert" | "forest" | "tundra";

export type TileType = "road" | "crate" | "milestone";

export interface Tile {
  index: number;
  type: TileType;
  biome: BiomeType;
}

export type RewardType = "scrap" | "boost" | "irl_ticket";

export interface LootResult {
  type: RewardType;
  label: string;
}

export interface VehicleLevel {
  level: number;
  minDistance: number;
  sprite: string;
  name: string;
}

export type AnimationEventType = "move" | "crate" | "zap" | "evolve";

export interface AnimationEvent {
  type: AnimationEventType;
  payload: {
    fromPosition?: number;
    toPosition?: number;
    reward?: LootResult;
    newLevel?: VehicleLevel;
  };
}

export interface GameState {
  id: string;
  player_id: string;
  vehicle_position: number;
  storm_position: number;
  vehicle_level: number;
  total_distance: number;
  current_streak: number;
  week_start_position: number;
  scrap_count: number;
  boost_count: number;
  coin_count: number;
  silver_count: number;
  gold_count: number;
  last_storm_tick: string;
  daily_task_count: number;
  updated_at: string;
}
