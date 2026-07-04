"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { SiteHeader } from "@/components/SiteHeader";
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
        <section>
          <div className="relative py-24 md:pb-32 lg:pb-36 lg:pt-72">
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
              <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ecdc4] animate-pulse" />
                  Multi-agent care · Gemma on AMD
                </p>
                <h1 className="mt-4 max-w-2xl text-balance text-5xl font-bold tracking-tight md:text-6xl lg:mt-8 xl:text-7xl">
                  Care shouldn&apos;t feel like{" "}
                  <span className="bg-gradient-to-r from-[#ff6b6b] via-[#ff8e8e] to-[#4ecdc4] bg-clip-text text-transparent">
                    chaos
                  </span>
                </h1>
                <p className="mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                  Neuroloom weaves your family&apos;s care into one living command center —
                  medications, handoffs, documents, and emergencies.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                  <Button asChild size="lg" className="h-12 rounded-full pl-5 pr-3 text-base">
                    <Link href="/onboarding">
                      <span className="text-nowrap">Create Care Circle</span>
                      <ChevronRight className="ml-1 size-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-12 rounded-full px-5 text-base hover:bg-white/5"
                  >
                    <Link href="#agents">
                      <span className="text-nowrap">See how it works</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-1 overflow-hidden rounded-3xl border border-white/10 sm:aspect-video lg:rounded-[3rem]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="size-full object-cover opacity-40 invert dark:opacity-50 dark:invert-0 dark:lg:opacity-70"
                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-background pb-2">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-48 md:border-r md:border-white/10 md:pr-6">
                <p className="text-end text-sm text-muted-foreground">Powered by</p>
              </div>
              <div className="relative py-6 md:w-[calc(100%-12rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  {PARTNERS.map((p) => (
                    <div key={p.name} className="flex px-4">
                      <span className="text-sm font-semibold tracking-wide text-muted-foreground/80">
                        {p.label}
                      </span>
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
        <section id="features" className="border-t border-white/10 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">53M caregivers. Zero command centers.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
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
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-sm"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-[#ff6b6b] to-[#4ecdc4] bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">Nine agents. One care circle.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Orchestrated by Conductor, powered by Gemma on AMD GPUs.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ALL_AGENTS.map((agent) => (
                <div
                  key={agent}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#4ecdc4]/30"
                >
                  <AgentIcon name={agent.replace(/\s/g, "")} size={26} />
                  <span className="text-sm font-medium">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AMD */}
        <section id="amd" className="border-y border-white/10 bg-white/[0.02] py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 md:flex-row">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl"
              style={{ backgroundColor: `${BRAND.teal}18` }}
            >
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Sensitive data stays on AMD</h2>
              <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                Prescriptions and discharge papers are processed by Gemma on AMD Developer Cloud —
                not retained on third-party APIs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold">Start your care circle</h2>
            <p className="mt-4 text-muted-foreground">Free for one care recipient. Live in minutes.</p>
            <Button asChild size="lg" className="mt-10 h-12 rounded-full px-8">
              <Link href="/onboarding">Launch Neuroloom</Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-white/10 py-10 text-center text-sm text-muted-foreground">
          <p>Neuroloom — Coordination only, not medical advice.</p>
          <p className="mt-2">Gemma on AMD · Multi-Agent · MIT License</p>
        </footer>
      </main>
    </>
  );
}
