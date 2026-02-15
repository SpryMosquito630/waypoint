"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LootResult } from "@/types/game";

interface CrateRevealProps {
  reward: LootResult | null;
  onClose: () => void;
}

const rewardIcons: Record<string, string> = {
  scrap: "S",
  boost: "B",
  irl_ticket: "T",
};

const rewardColors: Record<string, string> = {
  scrap: "from-zinc-500 to-zinc-400",
  boost: "from-blue-500 to-cyan-400",
  irl_ticket: "from-blue-600 to-sky-400",
};

export function CrateReveal({ reward, onClose }: CrateRevealProps) {
  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Crate icon */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 360 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`w-20 h-20 mx-auto rounded-xl bg-gradient-to-br ${rewardColors[reward.type]} flex items-center justify-center text-3xl font-bold text-white mb-4`}
            >
              {rewardIcons[reward.type]}
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-white"
            >
              {reward.label}!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-zinc-400 text-sm mt-2"
            >
              {reward.type === "irl_ticket"
                ? "Ask your parent to redeem this!"
                : "Added to your inventory."}
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Nice!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
