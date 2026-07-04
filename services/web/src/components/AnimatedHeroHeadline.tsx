"use client";

import { motion } from "framer-motion";

const lineEase = [0.22, 1, 0.36, 1] as const;

export function AnimatedHeroHeadline() {
  return (
    <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
      {/* Line 1 — like "Hello" */}
      <motion.span
        className="block text-balance"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: lineEase }}
      >
        Your family care
      </motion.span>

      {/* Line 2 — like "World" arriving after */}
      <motion.span
        className="block text-balance mt-1 sm:mt-2"
        initial={{ opacity: 0, y: 32, filter: "blur(14px)", scale: 0.96 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
        transition={{ delay: 0.55, duration: 0.8, ease: lineEase }}
      >
        <span className="chaos-word inline-block">command center</span>
        <motion.span
          className="inline-block text-white/80"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.15, duration: 0.35, ease: "backOut" }}
          aria-hidden
        >
          .
        </motion.span>
      </motion.span>
    </h1>
  );
}
