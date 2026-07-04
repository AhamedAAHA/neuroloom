"use client";

import { cn } from "@/lib/utils";
import { animate, motion, useMotionValue } from "framer-motion";
import React, { useEffect, useState } from "react";
import useMeasure from "react-use-measure";

export type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 40,
  speedOnHover,
  className,
}: InfiniteSliderProps) {
  const [ref, { width }] = useMeasure();
  const x = useMotionValue(0);
  const [hovered, setHovered] = useState(false);
  const duration = hovered && speedOnHover ? speedOnHover : speed;

  useEffect(() => {
    if (!width) return;
    const controls = animate(x, -width / 2, {
      ease: "linear",
      duration: width / duration,
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [x, width, duration]);

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div className="flex w-max" style={{ x, gap: `${gap}px` }} ref={ref}>
        {children}
        {children}
      </motion.div>
    </div>
  );
}
