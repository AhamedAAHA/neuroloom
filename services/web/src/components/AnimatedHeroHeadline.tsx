"use client";

import { motion } from "framer-motion";

export function AnimatedHeroHeadline() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.2 }}
      className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-[4.25rem]"
    >
      Care shouldn&apos;t feel like{" "}
      <span className="chaos-word">chaos</span>
    </motion.h1>
  );
}
