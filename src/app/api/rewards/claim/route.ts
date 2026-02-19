import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getPlayerSeed } from "@/lib/game/engine";
import { rollLoot, pickTicketDescription } from "@/lib/game/loot";
import type { LootResult, RewardType, GameState } from "@/types/game";

function getRewardLabel(type: RewardType): string {
  if (type === "scrap") return "Scrap Metal";
  if (type === "boost") return "Speed Boost";
  return "IRL Ticket";
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let tileIndex: number | undefined;
  try {
    const body = await request.json();
    tileIndex = body?.tileIndex;
  } catch {
    tileIndex = undefined;
  }

  const parsedTileIndex =
    typeof tileIndex === "number" ? tileIndex : Number(tileIndex);

  if (!Number.isInteger(parsedTileIndex) || parsedTileIndex < 0) {
    return NextResponse.json({ error: "invalid tile index" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: existingError } = await admin
    .from("rewards")
    .select("id, reward_type, tile_index")
    .eq("player_id", user.id)
    .eq("tile_index", parsedTileIndex)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  let reward: LootResult;

  if (existing) {
    reward = {
      type: existing.reward_type as RewardType,
      label: getRewardLabel(existing.reward_type as RewardType),
    };
  } else {
    const seed = getPlayerSeed(user.id);
    const loot = rollLoot(parsedTileIndex, seed);
    const metadata =
      loot.type === "irl_ticket"
        ? { description: pickTicketDescription(parsedTileIndex, seed) }
        : {};

    const { error: insertError } = await admin.from("rewards").insert({
      player_id: user.id,
      reward_type: loot.type,
      tile_index: parsedTileIndex,
      metadata,
    });

    if (insertError) {
      return NextResponse.json({ error: "insert failed" }, { status: 500 });
    }

    reward = { type: loot.type, label: loot.label };

    if (loot.type === "scrap" || loot.type === "boost") {
      const { data: current } = await admin
        .from("game_state")
        .select("scrap_count, boost_count")
        .eq("player_id", user.id)
        .single();

      if (current) {
        const updates =
          loot.type === "scrap"
            ? { scrap_count: current.scrap_count + 1 }
            : { boost_count: current.boost_count + 1 };
        await admin
          .from("game_state")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("player_id", user.id);
      }
    }
  }

  const { data: gameState } = await admin
    .from("game_state")
    .select("*")
    .eq("player_id", user.id)
    .single();

  return NextResponse.json({
    reward,
    gameState: (gameState ?? null) as GameState | null,
  });
}
