"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useScroll, motion } from "framer-motion";
import { BrandLogo } from "@/lib/icons";

const menuItems = [
  { name: "Features", href: "/#features" },
  { name: "Agents", href: "/#agents" },
  { name: "AMD", href: "/#amd" },
  { name: "Dashboard", href: "/onboarding" },
];

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(solid);
  const { scrollYProgress } = useScroll();

  React.useEffect(() => {
    if (solid) return;
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.02);
    });
    return () => unsubscribe();
  }, [scrollYProgress, solid]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav data-state={menuState && "active"} className="group pointer-events-auto w-full pt-2">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12",
            "border border-white/10 bg-background/70 backdrop-blur-xl",
            scrolled && "bg-background/85 shadow-lg shadow-black/20"
          )}
        >
          <motion.div
            className={cn(
              "relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6",
              scrolled && "lg:py-4"
            )}
          >
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link href="/" aria-label="Neuroloom home" className="flex items-center gap-2.5">
                <BrandLogo size={36} />
                <span className="font-semibold text-lg tracking-tight">Neuroloom</span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="block text-zinc-300 duration-150 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="block text-zinc-300 duration-150 hover:text-white"
                        onClick={() => setMenuState(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/onboarding">Dashboard</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/onboarding">Start Free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
