"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import scoutImg from "../../../assets/Scout_chest.png";
import raiderImg from "../../../assets/Raider_chest.png";
import legendImg from "../../../assets/Legend_chest.png";

const CHESTS = [
  {
    name: "Scout Chest",
    cost: 500,
    desc: "Small rewards, high chance of scrap.",
    image: scoutImg,
    odds: { scrap: 50, boost: 25, coin_bundle: 20, irl_ticket: 5 },
    currency: "bronze coins",
  },
  {
    name: "Raider Chest",
    cost: 50,
    desc: "Balanced mix of boosts and scrap.",
    image: raiderImg,
    odds: { scrap: 35, boost: 30, coin_bundle: 20, irl_ticket: 15 },
    currency: "silver",
  },
  {
    name: "Legend Chest",
    cost: 2,
    desc: "Best odds for rare tickets.",
    image: legendImg,
    odds: { scrap: 20, boost: 25, coin_bundle: 20, irl_ticket: 35 },
    currency: "gold",
  },
];
const THEMES = ["standard", "neon", "royal"] as const;

export function ShopGrid() {
  const [showReward, setShowReward] = useState(false);
  const [spinnerReady, setSpinnerReady] = useState(false);
  const [oddsChest, setOddsChest] = useState<(typeof CHESTS)[number] | null>(
    null
  );
  const [reward, setReward] = useState<{
    title: string;
    type: "scrap" | "boost" | "irl_ticket" | "coin_bundle";
    desc: string;
  } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningReward, setWinningReward] = useState<typeof reward | null>(
    null
  );
  const stripRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [burstFor, setBurstFor] = useState<string | null>(null);
  const [burstParticles, setBurstParticles] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);
  const [beamFor, setBeamFor] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "shake" | "beam" | "spinner">(
    "idle"
  );
  const [legendBurst, setLegendBurst] = useState(false);
  const [raiderBurst, setRaiderBurst] = useState(false);
  const [freeSpinReady, setFreeSpinReady] = useState(false);
  const [activeTheme, setActiveTheme] = useState<(typeof THEMES)[number]>(
    "standard"
  );

  useEffect(() => {
    const today = new Date();
    const key = today.toISOString().slice(0, 10);
    const last = window.localStorage.getItem("scout_free_spin_day");
    setFreeSpinReady(last !== key);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("activeTheme");
    if (stored === "standard" || stored === "neon" || stored === "royal") {
      setActiveTheme(stored);
    }
  }, []);

  const setTheme = (theme: (typeof THEMES)[number]) => {
    setActiveTheme(theme);
    window.localStorage.setItem("activeTheme", theme);
  };

  const rewardPool = useMemo(
    () => [
      {
        title: "Scrap Cache",
        type: "scrap" as const,
        desc: "A pile of scrap metal for future upgrades.",
      },
      {
        title: "Speed Boost",
        type: "boost" as const,
        desc: "A temporary boost for the next mission.",
      },
      {
        title: "IRL Ticket",
        type: "irl_ticket" as const,
        desc: "A real‑world reward your parent can approve.",
      },
      {
        title: "Bronze Coin Bundle",
        type: "coin_bundle" as const,
        desc: "Extra bronze coins to spend in the bounty shop.",
      },
    ],
    []
  );

  const rewardIcon = (type: string) => {
    if (type === "scrap") return "⚙️";
    if (type === "boost") return "⚡";
    if (type === "irl_ticket") return "🎟️";
    return "🪙";
  };

  const pickReward = (chest: (typeof CHESTS)[number]) => {
    const total = Object.values(chest.odds).reduce((a, b) => a + b, 0);
    const roll = Math.random() * total;
    let acc = 0;
    for (const [type, weight] of Object.entries(chest.odds)) {
      acc += weight;
      if (roll <= acc) {
        return rewardPool.find((r) => r.type === type) ?? rewardPool[0];
      }
    }
    return rewardPool[0];
  };

  const triggerSequence = (chestName: string) => {
    if (chestName === "Legend Chest") {
      setLegendBurst(true);
      window.setTimeout(() => setLegendBurst(false), 1200);
    }
    if (chestName === "Raider Chest") {
      setRaiderBurst(true);
      window.setTimeout(() => setRaiderBurst(false), 1000);
    }
    setStage("shake");
    setBurstFor(chestName);
    setBeamFor(null);
    setSpinnerReady(false);
    setShowReward(false);
    setBurstParticles(
      Array.from({ length: 12 }, () => ({
        x: Math.random() * 90 - 45,
        y: Math.random() * -70 - 10,
        delay: Math.random() * 0.12,
        size: 4 + Math.random() * 6,
      }))
    );

    window.setTimeout(() => {
      setStage("beam");
      setBeamFor(chestName);
    }, 400);

    window.setTimeout(() => {
      setStage("spinner");
      setBurstFor(null);
      setBeamFor(null);
      setBurstParticles([]);
      setSpinnerReady(true);
      setShowReward(true);
    }, 1100);
  };

  const claimScoutSpin = (isFree: boolean) => {
    const pick = pickReward(CHESTS[0]);
    setReward(pick);
    setSpinnerReady(false);
    triggerSequence("Scout Chest");
    if (isFree) {
      const today = new Date().toISOString().slice(0, 10);
      window.localStorage.setItem("scout_free_spin_day", today);
      setFreeSpinReady(false);
    }
  };

  const reel = useMemo(() => {
    const items: typeof rewardPool = [];
    for (let i = 0; i < 60; i++) {
      items.push(rewardPool[i % rewardPool.length]);
    }
    return items;
  }, [rewardPool]);

  useEffect(() => {
    if (
      !showReward ||
      !spinnerReady ||
      !reward ||
      !stripRef.current ||
      !frameRef.current
    ) {
      return;
    }

    const strip = stripRef.current;
    const frame = frameRef.current;

    setIsSpinning(true);
    setWinningReward(null);

    const cardWidth = 160;
    const gap = 12;
    const step = cardWidth + gap;
    const frameWidth = frame.clientWidth;

    const targetIndex = (() => {
      for (let i = reel.length - 1; i >= 0; i--) {
        if (reel[i].title === reward.title) return i;
      }
      return reel.length - 1;
    })();

    const targetX =
      -(targetIndex * step) + frameWidth / 2 - cardWidth / 2;

    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
    void strip.offsetHeight;

    const durationMs = 5200;
    strip.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.8, 0.12, 1)`;
    strip.style.transform = `translateX(${targetX}px)`;

    const onDone = () => {
      setIsSpinning(false);
      setWinningReward(reward);
      strip.removeEventListener("transitionend", onDone);
    };

    strip.addEventListener("transitionend", onDone);
  }, [showReward, spinnerReady, reward, reel]);

  return (
    <>
      {raiderBurst && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="raider-burst" />
        </div>
      )}
      {legendBurst && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="legend-burst" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHESTS.map((chest) => (
          <div
            key={chest.name}
            className={`relative rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-center ${
              burstFor === chest.name ? "chest-shake" : ""
            }`}
          >
            {burstFor === chest.name && (
              <div className="pointer-events-none absolute inset-0">
                {beamFor === chest.name && (
                  <div className="chest-beam" />
                )}
                {burstParticles.map((p, idx) => (
                  <span
                    key={`${chest.name}-p-${idx}`}
                    className="chest-particle"
                    style={{
                      left: "50%",
                      top: "40%",
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      ["--tx" as string]: `${p.x}px`,
                      ["--ty" as string]: `${p.y}px`,
                      animationDelay: `${p.delay}s`,
                    }}
                  />
                ))}
                <span className="chest-glow" />
              </div>
            )}
            <div className="mx-auto mb-3 h-24 w-24 rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-200/20 to-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.25)] overflow-hidden">
              <Image
                src={chest.image}
                alt={chest.name}
                className="h-full w-full object-contain"
              />
            </div>
            <h4 className="text-sm font-semibold text-amber-100">
              {chest.name}
            </h4>
            <button
              onClick={() => setOddsChest(chest)}
              className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/40 bg-amber-500/10 text-xs text-amber-100 hover:bg-amber-500/20 transition-colors"
              aria-label={`Show odds for ${chest.name}`}
            >
              i
            </button>
            <p className="mt-1 text-xs text-amber-200/70">{chest.desc}</p>
            <div className="mt-3 text-xs uppercase tracking-widest text-amber-200/80">
              Cost {chest.cost} {chest.currency}
            </div>
            {chest.name === "Scout Chest" && freeSpinReady && (
              <button
                onClick={() => claimScoutSpin(true)}
                className="mt-3 w-full rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/30 transition-colors"
              >
                Free Daily Spin
              </button>
            )}
            <button
              onClick={() => {
                if (chest.name === "Scout Chest") {
                  claimScoutSpin(false);
                  return;
                }
                const pick = pickReward(chest);
                setReward(pick);
                setSpinnerReady(false);
                triggerSequence(chest.name);
              }}
              className="mt-3 w-full rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-xs uppercase tracking-widest text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Theme preview
            </p>
            <h3 className="text-sm font-semibold text-amber-100">
              Bounty card style
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                onClick={() => setTheme(theme)}
                className={`text-xs rounded-full border px-3 py-1 uppercase tracking-widest transition-colors ${
                  activeTheme === theme
                    ? "border-amber-300/70 bg-amber-500/30 text-amber-100"
                    : "border-amber-300/30 bg-amber-500/10 text-amber-200/80 hover:bg-amber-500/20"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 max-w-sm">
          <div className={`bounty-poster ${activeTheme}`}>
            <div className="bounty-poster-inner">
              <p className="bounty-title">Wanted</p>
              <p className="bounty-name">Theme Preview</p>
              <p className="bounty-desc">See how your bounty cards look.</p>
              <div className="bounty-meta">
                <span>Reward +2 Medium</span>
                <span>Due Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-950 via-zinc-950 to-zinc-950 p-5 text-center text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Reward
            </p>
            <div className="relative mx-auto my-6 w-full max-w-xl">
              <div
                ref={frameRef}
                className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-amber-500/10 py-6"
                style={{
                  opacity: stage === "spinner" ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 bg-amber-200/70 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                <div ref={stripRef} className="flex items-center gap-3 px-6">
                  {reel.map((item, idx) => (
                    <div
                      key={`${item.title}-${idx}`}
                      className="flex h-40 w-40 flex-shrink-0 flex-col items-center justify-between rounded-xl border border-amber-300/30 bg-amber-200/10 p-3 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                      style={{ width: 160 }}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-amber-200/40 bg-amber-500/10 text-2xl">
                        {rewardIcon(item.type)}
                      </div>
                      <div className="text-lg">{rewardIcon(item.type)}</div>
                      <div className="text-xs uppercase tracking-widest">
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-200/70">
                {isSpinning
                  ? "Spinning..."
                  : winningReward
                    ? `You won: ${winningReward.title}`
                    : "Ready to reveal."}
              </p>
            </div>
            {winningReward && (
              <>
                <h4 className="text-lg font-semibold">
                  {winningReward.title}
                </h4>
                <p className="mt-2 text-xs text-amber-200/70">
                  {winningReward.desc}
                </p>
              </>
            )}
            <button
              onClick={() => setShowReward(false)}
              className="mt-4 w-full rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-2 text-xs uppercase tracking-widest text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {oddsChest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-950 via-zinc-950 to-zinc-950 p-5 text-center text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Reward odds
            </p>
            <h4 className="mt-2 text-lg font-semibold">{oddsChest.name}</h4>
            <div className="mt-4 space-y-2 text-sm text-amber-200/80">
              <div className="flex items-center justify-between">
                <span>Scrap</span>
                <span>{oddsChest.odds.scrap}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Boost</span>
                <span>{oddsChest.odds.boost}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bronze coin bundle</span>
                <span>{oddsChest.odds.coin_bundle}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IRL ticket</span>
                <span>{oddsChest.odds.irl_ticket}%</span>
              </div>
            </div>
            <button
              onClick={() => setOddsChest(null)}
              className="mt-4 w-full rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-2 text-xs uppercase tracking-widest text-amber-100 hover:bg-amber-500/30 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
