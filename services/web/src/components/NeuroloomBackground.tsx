"use client";

import { useEffect, useRef } from "react";

const TEAL = { r: 78, g: 205, b: 196 };
const CORAL = { r: 255, g: 107, b: 107 };
const PURPLE = { r: 167, g: 139, b: 250 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function NeuroloomBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const helixLayout = () => {
      const wide = w >= 1024;
      return {
        cx: wide ? w * 0.72 : w * 0.5,
        cy: wide ? h * 0.46 : h * 0.58,
        amp: Math.min(w, h) * (wide ? 0.1 : 0.07),
        stretch: Math.min(h * (wide ? 0.68 : 0.45), h - 120),
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const helixPoints = 100;
    const particles = Array.from({ length: 64 }, (_, i) => ({
      t: (i / 64) * Math.PI * 4,
      strand: i % 2,
      speed: 0.0025 + (i % 5) * 0.0005,
      size: 1 + (i % 3) * 0.5,
    }));

    let time = 0;

    const draw = () => {
      time += reducedMotion ? 0 : 0.01;
      ctx.clearRect(0, 0, w, h);

      const { cx, cy, amp, stretch } = helixLayout();
      const freq = 0.026;

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, stretch * 0.6);
      glow.addColorStop(0, "rgba(78, 205, 196, 0.14)");
      glow.addColorStop(0.4, "rgba(255, 107, 107, 0.07)");
      glow.addColorStop(1, "rgba(9, 9, 11, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const strandA: { x: number; y: number }[] = [];
      const strandB: { x: number; y: number }[] = [];

      for (let i = 0; i <= helixPoints; i++) {
        const py = cy - stretch / 2 + (i / helixPoints) * stretch;
        const phase = py * freq + time;
        strandA.push({ x: cx + Math.sin(phase) * amp, y: py });
        strandB.push({ x: cx + Math.sin(phase + Math.PI) * amp, y: py });
      }

      for (let i = 0; i < helixPoints; i += 4) {
        const t = i / helixPoints;
        const a = strandA[i];
        const b = strandB[i];
        const alpha = 0.1 + Math.sin(time + i * 0.15) * 0.05;
        ctx.strokeStyle = `rgba(${lerp(TEAL.r, PURPLE.r, t)}, ${lerp(TEAL.g, PURPLE.g, t)}, ${lerp(TEAL.b, PURPLE.b, t)}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      const drawStrand = (points: { x: number; y: number }[], color: typeof TEAL, alpha: number) => {
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      };

      drawStrand(strandA, TEAL, 0.65);
      drawStrand(strandB, CORAL, 0.58);

      for (let i = 0; i < helixPoints; i += 6) {
        for (const [pt, col] of [
          [strandA[i], TEAL],
          [strandB[i], CORAL],
        ] as const) {
          const pulse = 0.45 + Math.sin(time * 1.8 + i * 0.25) * 0.55;
          const radius = 4 + pulse * 5;
          const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
          grd.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${0.9 * pulse})`);
          grd.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      particles.forEach((p) => {
        if (!reducedMotion) p.t += p.speed;
        const py = cy - stretch / 2 + ((p.t % (Math.PI * 4)) / (Math.PI * 4)) * stretch;
        const phase = py * freq + time + p.strand * Math.PI;
        const px = cx + Math.sin(phase) * amp * (p.strand === 0 ? 1 : -1);
        const col = p.strand === 0 ? TEAL : CORAL;
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.75)`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
    </div>
  );
}
