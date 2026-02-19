import Link from "next/link";
import { TradingHub } from "@/components/game/TradingHub";

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Trading Hub
            </p>
            <h1 className="text-2xl font-semibold">Convert Your Coins</h1>
          </div>
          <Link
            href="/dashboard?mode=bounty"
            className="text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 hover:bg-white/20 transition-colors"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <TradingHub />
      </main>
    </div>
  );
}
