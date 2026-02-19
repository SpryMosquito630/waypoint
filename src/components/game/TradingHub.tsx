"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Balances = {
  bronze: number;
  silver: number;
  gold: number;
};

const STORAGE_KEY = "trading_balances";

const DEFAULT_BALANCES: Balances = {
  bronze: 500,
  silver: 10,
  gold: 1,
};

function playSuccessTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(740, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc1.connect(gain);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(520, now);
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.15);
    osc2.connect(gain);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    window.setTimeout(() => ctx.close(), 700);
  } catch {
    // ignore audio errors
  }
}

export function TradingHub() {
  const [balances, setBalances] = useState<Balances>(DEFAULT_BALANCES);
  const [hydrated, setHydrated] = useState(false);
  const [anim, setAnim] = useState<
    "bronze-to-silver" | "silver-to-gold" | null
  >(null);
  const [loadingBalances, setLoadingBalances] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          typeof parsed?.bronze === "number" &&
          typeof parsed?.silver === "number" &&
          typeof parsed?.gold === "number"
        ) {
          setBalances(parsed);
        }
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingBalances(false);
        return;
      }
      const { data } = await supabase
        .from("game_state")
        .select("coin_count, silver_count, gold_count")
        .eq("player_id", user.id)
        .single();
      if (data) {
        setBalances({
          bronze: data.coin_count ?? 0,
          silver: data.silver_count ?? 0,
          gold: data.gold_count ?? 0,
        });
      }
      setLoadingBalances(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bronze: balances.bronze,
        silver: balances.silver,
        gold: balances.gold,
      })
    );
  }, [balances, hydrated]);

  const canBronzeToSilver = balances.bronze >= 100;
  const canSilverToGold = balances.silver >= 50;

  const onBronzeToSilver = async () => {
    if (!canBronzeToSilver || loadingBalances) return;
    const supabase = createClient();
    const prev = balances;
    setBalances((b) => ({
      bronze: b.bronze - 100,
      silver: b.silver + 5,
      gold: b.gold,
    }));
    setAnim("bronze-to-silver");
    playSuccessTone();
    window.setTimeout(() => setAnim(null), 700);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("game_state")
      .update({
        coin_count: prev.bronze - 100,
        silver_count: prev.silver + 5,
      })
      .eq("player_id", user.id);
    if (error) {
      setBalances(prev);
    }
  };

  const onSilverToGold = async () => {
    if (!canSilverToGold || loadingBalances) return;
    const supabase = createClient();
    const prev = balances;
    setBalances((b) => ({
      bronze: b.bronze,
      silver: b.silver - 50,
      gold: b.gold + 1,
    }));
    setAnim("silver-to-gold");
    playSuccessTone();
    window.setTimeout(() => setAnim(null), 700);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("game_state")
      .update({
        silver_count: prev.silver - 50,
        gold_count: prev.gold + 1,
      })
      .eq("player_id", user.id);
    if (error) {
      setBalances(prev);
    }
  };

  const cards = useMemo(
    () => [
      {
        label: "Bronze",
        value: balances.bronze,
        glow: "shadow-[0_0_30px_rgba(251,146,60,0.45)]",
        ring: "border-orange-400/40",
        icon: "B",
        animateShrink: anim === "bronze-to-silver",
      },
      {
        label: "Silver",
        value: balances.silver,
        glow: "shadow-[0_0_30px_rgba(148,163,184,0.45)]",
        ring: "border-slate-300/40",
        icon: "S",
        animateShrink: anim === "silver-to-gold",
        animatePulse: anim === "bronze-to-silver",
      },
      {
        label: "Gold",
        value: balances.gold,
        glow: "shadow-[0_0_40px_rgba(250,204,21,0.6)]",
        ring: "border-yellow-300/50",
        icon: "G",
        animatePulse: anim === "silver-to-gold",
      },
    ],
    [balances, anim]
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative rounded-2xl border ${card.ring} bg-white/5 px-5 py-6 text-center ${card.glow}`}
          >
            <div
              className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-semibold text-white/90 ${
                card.animateShrink ? "coin-shrink" : ""
              } ${card.animatePulse ? "coin-pulse" : ""}`}
            >
              {card.icon}
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Convert
              </p>
              <h3 className="mt-2 text-lg font-semibold">Bronze to Silver</h3>
            </div>
            <button
              className="h-6 w-6 rounded-full border border-white/20 bg-white/10 text-xs text-white/80 hover:bg-white/20 transition-colors"
              title="Exchange rate: 100 Bronze → 5 Silver (1 Silver = 20 Bronze)"
              aria-label="Bronze to Silver rate"
            >
              i
            </button>
          </div>
          <p className="mt-2 text-sm text-white/70">
            100 Bronze → 5 Silver
          </p>
          <button
            onClick={onBronzeToSilver}
            disabled={!canBronzeToSilver || loadingBalances}
            className="mt-4 w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/80 transition disabled:opacity-40"
          >
            Convert
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Convert
              </p>
              <h3 className="mt-2 text-lg font-semibold">Silver to Gold</h3>
            </div>
            <button
              className="h-6 w-6 rounded-full border border-white/20 bg-white/10 text-xs text-white/80 hover:bg-white/20 transition-colors"
              title="Exchange rate: 50 Silver → 1 Gold (1 Gold = 50 Silver)"
              aria-label="Silver to Gold rate"
            >
              i
            </button>
          </div>
          <p className="mt-2 text-sm text-white/70">
            50 Silver → 1 Gold
          </p>
          <button
            onClick={onSilverToGold}
            disabled={!canSilverToGold || loadingBalances}
            className="mt-4 w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/80 transition disabled:opacity-40"
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );
}
