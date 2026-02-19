import Link from "next/link";
import { ShopGrid } from "@/components/game/ShopGrid";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function ShopPage() {
  const supabasePromise = createClient();
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ShopHeader supabasePromise={supabasePromise} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <ShopGrid />
      </main>
    </div>
  );
}

async function ShopHeader({
  supabasePromise,
}: {
  supabasePromise: ReturnType<typeof createClient>;
}) {
  const supabase = await supabasePromise;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: gameState } = await supabase
    .from("game_state")
    .select("coin_count, silver_count, gold_count")
    .eq("player_id", user.id)
    .single();

  return (
    <header className="border-b border-zinc-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
            Bounty Shop
          </p>
          <h1 className="text-lg font-semibold text-amber-100">
            Choose a chest
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
              Bronze coins: {gameState?.coin_count ?? 0}
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              Silver: {gameState?.silver_count ?? 0}
            </div>
            <div className="rounded-full border border-yellow-300/30 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-100">
              Gold: {gameState?.gold_count ?? 0}
            </div>
          </div>
          <Link
            href="/dashboard?mode=bounty"
            className="text-xs rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-amber-100 hover:bg-amber-500/20 transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    </header>
  );
}
