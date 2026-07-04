"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { SiteHeader } from "@/components/SiteHeader";
import { AnimatedHeroHeadline } from "@/components/AnimatedHeroHeadline";
import { ChevronRight } from "lucide-react";
import { ALL_AGENTS, AgentIcon, BRAND } from "@/lib/icons";

const PARTNERS = [
  { name: "AMD", label: "AMD" },
  { name: "Gemma", label: "Gemma" },
  { name: "Fireworks", label: "Fireworks AI" },
  { name: "ROCm", label: "ROCm" },
  { name: "lablab", label: "lablab.ai" },
  { name: "Gemma2", label: "Google DeepMind" },
];

export function HeroSection() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-x-hidden bg-background">
        {/* Hero — fixed layout: text never sits under raw video */}
        <section className="relative min-h-[92vh] overflow-hidden">
          {/* Video layer (background only) */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-y-0 right-0 w-full lg:w-[62%] overflow-hidden rounded-none lg:rounded-l-[3rem] border-0 lg:border-l border-white/10">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="size-full object-cover opacity-50 lg:opacity-70"
                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
              />
            </div>
            <div className="hero-scrim absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
          </div>

          {/* Content layer — always on top, readable */}
          <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 pb-20 pt-32 lg:px-12 lg:pt-36">
            <div className="max-w-2xl rounded-3xl border border-white/10 bg-background/40 p-8 backdrop-blur-md lg:bg-background/30 lg:p-10">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-zinc-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ecdc4] animate-pulse" />
                Multi-agent care · Gemma on AMD
              </motion.p>

              <AnimatedHeroHeadline />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="mt-8 max-w-xl text-balance text-lg leading-relaxed text-zinc-300"
              >
                Neuroloom weaves your family&apos;s care into one living command center —
                medications, handoffs, documents, and emergencies.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
              >
                <Button asChild size="lg" className="h-12 rounded-full pl-5 pr-3 text-base shadow-lg shadow-[#ff6b6b]/20">
                  <Link href="/onboarding">
                    <span className="text-nowrap">Create Care Circle</span>
                    <ChevronRight className="ml-1 size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/20 bg-white/5 px-5 text-base text-zinc-100 hover:bg-white/10"
                >
                  <Link href="#agents">
                    <span className="text-nowrap">See how it works</span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="relative z-10 border-t border-white/10 bg-background py-6">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-48 md:border-r md:border-white/10 md:pr-6">
                <p className="text-center text-sm font-medium text-zinc-300 md:text-end">Powered by</p>
              </div>
              <div className="relative py-4 md:w-[calc(100%-12rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  {PARTNERS.map((p) => (
                    <div key={p.name} className="flex px-4">
                      <span className="text-sm font-semibold tracking-wide text-zinc-400">{p.label}</span>
                    </div>
                  ))}
                </InfiniteSlider>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
                <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-20" direction="left" />
                <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-20" direction="right" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 border-t border-white/10 bg-zinc-950/50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
              53M caregivers. Zero command centers.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-zinc-400">
              Families juggle WhatsApp, sticky notes, and scattered PDFs while aging parents need coordinated care.
            </p>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                { value: "60%", label: "of seniors take 3+ medications" },
                { value: "4+", label: "apps families use to coordinate" },
                { value: "72h", label: "critical post-discharge window" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm"
                >
                  <div className="font-display text-4xl font-bold text-gradient">{s.value}</div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="relative z-10 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
              Nine agents. One care circle.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base text-zinc-400">
              Orchestrated by Conductor, powered by Gemma on AMD GPUs.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_AGENTS.map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#4ecdc4]/40 hover:bg-white/[0.06]"
                >
                  <AgentIcon name={agent.replace(/\s/g, "")} size={26} />
                  <span className="text-sm font-medium text-zinc-100">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AMD */}
        <section id="amd" className="relative z-10 border-y border-white/10 bg-zinc-950/50 py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 md:flex-row md:text-left">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl"
              style={{ backgroundColor: `${BRAND.teal}18` }}
            >
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-white">Sensitive data stays on AMD</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
                Prescriptions and discharge papers are processed by Gemma on AMD Developer Cloud —
                not retained on third-party APIs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 py-24 text-center">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-3xl font-bold text-white">Start your care circle</h2>
            <p className="mt-4 text-zinc-400">Free for one care recipient. Live in minutes.</p>
            <Button asChild size="lg" className="mt-10 h-12 rounded-full px-8 shadow-lg shadow-[#ff6b6b]/20">
              <Link href="/onboarding">Launch Neuroloom</Link>
            </Button>
          </div>
        </section>

        <footer className="relative z-10 border-t border-white/10 py-10 text-center text-sm text-zinc-500">
          <p>Neuroloom — Coordination only, not medical advice.</p>
          <p className="mt-2">Gemma on AMD · Multi-Agent · MIT License</p>
        </footer>
      </main>
    </>
  );
}
