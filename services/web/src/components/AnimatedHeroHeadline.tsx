"use client";

import { motion } from "framer-motion";

const lineOne = ["Care", "shouldn't", "feel", "like"];

const wordVariant = {
  hidden: { opacity: 0, y: 48, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.15 + i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AnimatedHeroHeadline() {
  return (
    <h1 className="font-display mt-4 max-w-3xl text-balance text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:mt-6 xl:text-7xl">
      <span className="block text-white">
        {lineOne.map((word, i) => (
          <motion.span
            key={word}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={wordVariant}
            className="mr-[0.28em] inline-block"
          >
            {word}
          </motion.span>
        ))}
      </span>
      <motion.span
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="chaos-word mt-1 inline-block"
      >
        chaos
      </motion.span>
    </h1>
  );
}
