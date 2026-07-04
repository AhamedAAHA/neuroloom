"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { SiteHeader } from "@/components/SiteHeader";
import { AnimatedHeroHeadline } from "@/components/AnimatedHeroHeadline";
import { NeuroloomBackground } from "@/components/NeuroloomBackground";
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

const sectionGlass =
  "border-white/10 bg-background/45 backdrop-blur-md supports-[backdrop-filter]:bg-background/35";

export function HeroSection() {
  return (
    <>
      <NeuroloomBackground />
      <SiteHeader />
      <main className="relative z-10 overflow-x-hidden">
        {/* Full-screen hero: headline + CTAs + partners — rest appears on scroll */}
        <section className="relative flex min-h-[100svh] flex-col">
          {/* Visual frame — fills first viewport */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-2 rounded-[1.5rem] border border-white/10 sm:inset-3 lg:inset-4 lg:rounded-[2.5rem]">
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-background/90 via-background/25 to-background/5 lg:bg-gradient-to-r lg:from-background/95 lg:via-background/45 lg:to-transparent" />
              <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/5" />
            </div>
          </div>

          {/* Hero copy — vertically centered in remaining space above partners */}
          <div className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-4 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
            <div className="mx-auto w-full max-w-7xl">
              <div className="hero-content-panel mx-auto max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-4 flex justify-center sm:mb-5 lg:justify-start"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/60 px-4 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ecdc4] animate-pulse" />
                    Multi-agent family care · Gemma on AMD
                  </span>
                </motion.div>

                <AnimatedHeroHeadline />

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.55 }}
                  className="mt-5 text-balance text-base leading-relaxed text-zinc-300 sm:mt-6 sm:text-lg"
                >
                  Your family&apos;s care command center — one place for medications, handoffs,
                  documents, check-ins, and emergencies. Nine AI agents on AMD Gemma keep everyone aligned.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.55 }}
                  className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start"
                >
                  <Button
                    asChild
                    size="lg"
                    className="h-11 rounded-full pl-5 pr-3 text-base shadow-lg shadow-[#ff6b6b]/20 sm:h-12 sm:w-auto w-full"
                  >
                    <Link href="/onboarding">
                      <span className="whitespace-nowrap">Create Care Circle</span>
                      <ChevronRight className="ml-1 size-5 shrink-0" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-11 w-full rounded-full border-white/20 bg-background/50 px-5 text-base text-zinc-100 backdrop-blur-sm hover:bg-white/10 sm:h-12 sm:w-auto"
                  >
                    <Link href="#features">
                      <span className="whitespace-nowrap">See how it works</span>
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Partners — pinned to bottom of first viewport */}
          <div className={`relative z-10 shrink-0 border-t py-4 sm:py-5 ${sectionGlass}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-0">
                <div className="shrink-0 sm:w-40 sm:border-r sm:border-white/10 sm:pr-5 md:w-44">
                  <p className="text-center text-sm font-medium text-zinc-400 sm:text-right">Powered by</p>
                </div>
                <div className="relative min-h-[2.5rem] w-full sm:flex-1">
                  <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                    {PARTNERS.map((p) => (
                      <div key={p.name} className="flex shrink-0 px-6">
                        <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-zinc-400">
                          {p.label}
                        </span>
                      </div>
                    ))}
                  </InfiniteSlider>
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background/50 to-transparent sm:w-16" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background/50 to-transparent sm:w-16" />
                  <ProgressiveBlur className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-16" direction="left" />
                  <ProgressiveBlur className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-16" direction="right" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className={`section-anchor relative border-t py-20 sm:py-24 ${sectionGlass}`}>
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
              53M caregivers. Zero command centers.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-center text-base leading-relaxed text-zinc-400">
              Families juggle WhatsApp, sticky notes, and scattered PDFs while aging parents need coordinated care.
            </p>
            <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-3">
              {[
                { value: "60%", label: "of seniors take 3+ medications" },
                { value: "4+", label: "apps families use to coordinate" },
                { value: "72h", label: "critical post-discharge window" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-background/55 p-6 text-center backdrop-blur-md sm:p-8"
                >
                  <div className="font-display text-4xl font-bold text-gradient">{s.value}</div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="section-anchor relative py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center font-display text-3xl font-bold text-white md:text-4xl">
              Nine agents. One care circle.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-center text-base text-zinc-400">
              Orchestrated by Conductor, powered by Gemma on AMD GPUs.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {ALL_AGENTS.map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/50 p-4 backdrop-blur-md transition hover:border-[#4ecdc4]/35 hover:bg-background/60"
                >
                  <AgentIcon name={agent.replace(/\s/g, "")} size={26} />
                  <span className="text-sm font-medium text-zinc-100">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AMD */}
        <section id="amd" className={`section-anchor relative border-y py-20 sm:py-24 ${sectionGlass}`}>
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 text-center md:flex-row md:gap-10 md:text-left">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-background/50 backdrop-blur-sm sm:h-24 sm:w-24"
              style={{ backgroundColor: `${BRAND.teal}18` }}
            >
              <span className="text-3xl" role="img" aria-label="Shield">
                🛡️
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Sensitive data stays on AMD
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mt-4">
                Prescriptions and discharge papers are processed by Gemma on AMD Developer Cloud —
                not retained on third-party APIs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 text-center sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-3xl font-bold text-white">Start your care circle</h2>
            <p className="mt-3 text-zinc-400 sm:mt-4">Free for one care recipient. Live in minutes.</p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8 shadow-lg shadow-[#ff6b6b]/20 sm:mt-10">
              <Link href="/onboarding">Launch Neuroloom</Link>
            </Button>
          </div>
        </section>

        <footer className={`relative border-t py-8 text-center text-sm text-zinc-500 sm:py-10 ${sectionGlass}`}>
          <p>Neuroloom — Coordination only, not medical advice.</p>
          <p className="mt-2">Gemma on AMD · Multi-Agent · MIT License</p>
        </footer>
      </main>
    </>
  );
}
