import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("rewards")
    .select("*")
    .eq("player_id", user.id)
    .eq("reward_type", "irl_ticket")
    .eq("claimed", false)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: gameState } = await supabase
    .from("game_state")
    .select("scrap_count, boost_count, total_distance, vehicle_level")
    .eq("player_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-500">Rewards</h1>
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Inventory */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {(gameState?.scrap_count ?? 0) + (gameState?.boost_count ?? 0)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Rewards</p>
          </div>
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
            <p className="text-2xl font-bold text-zinc-300">
              {gameState?.scrap_count ?? 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Scrap</p>
          </div>
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {gameState?.boost_count ?? 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Boosts</p>
          </div>
        </div>

        {/* Pending tickets */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tickets</h2>
          {(!tickets || tickets.length === 0) ? (
            <p className="text-zinc-500 text-sm py-8 text-center">
              No pending tickets.
            </p>
          ) : (
            <div className="space-y-2">
              {tickets.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-blue-900 text-blue-300">
                      T
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        IRL Ticket
                      </p>
                      <p className="text-xs text-zinc-500">
                        Tile {reward.tile_index}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
