"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/lib/icons";
import { clearAuthSession, getAuthSession, roleLabel } from "@/lib/auth-session";

const menuItems = [
  { name: "Features", href: "/#features" },
  { name: "Agents", href: "/#agents" },
  { name: "AMD", href: "/#amd" },
  { name: "Dashboard", href: "/dashboard" },
];

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(solid);
  const [auth, setAuth] = React.useState<ReturnType<typeof getAuthSession>>(null);

  React.useEffect(() => {
    setAuth(getAuthSession());
  }, []);

  React.useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  React.useEffect(() => {
    document.body.style.overflow = menuState ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuState]);

  return (
    <header>
      <nav
        data-state={menuState ? "active" : undefined}
        className="group fixed z-50 w-full px-3 pt-2 sm:px-4"
      >
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-2xl border border-white/10 px-4 transition-all duration-300 sm:rounded-3xl sm:px-6 lg:px-10",
            "bg-background/75 backdrop-blur-xl shadow-lg shadow-black/10",
            scrolled && "border-white/15 bg-background/90"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-4 py-3 lg:py-4",
              scrolled && "lg:py-3"
            )}
          >
            <Link href="/" aria-label="Neuroloom home" className="flex shrink-0 items-center gap-2.5">
              <BrandLogo size={36} variant="full" className="hidden sm:block h-9 w-auto" />
              <BrandLogo size={34} variant="icon" className="sm:hidden" />
              <span className="font-display text-lg font-bold tracking-tight text-white sm:hidden">Neuroloom</span>
            </Link>

            <ul className="hidden items-center gap-7 lg:flex">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                {auth ? (
                  <>
                    <span className="text-xs text-zinc-400 hidden md:inline">
                      {auth.name} · {roleLabel(auth.role)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/10"
                      onClick={() => {
                        clearAuthSession();
                        setAuth(null);
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/10 hover:text-white"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full shadow-md shadow-[#ff6b6b]/15">
                  <Link href="/dashboard">Start Free</Link>
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setMenuState((open) => !open)}
                aria-label={menuState ? "Close menu" : "Open menu"}
                aria-expanded={menuState}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-200 lg:hidden"
              >
                <Menu
                  className={cn(
                    "size-5 transition-all duration-200",
                    menuState && "scale-0 rotate-90 opacity-0"
                  )}
                />
                <X
                  className={cn(
                    "absolute size-5 transition-all duration-200",
                    menuState ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
                  )}
                />
              </button>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={menuState ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden lg:hidden"
          >
            <div className="space-y-6 border-t border-white/10 pb-5 pt-4">
              <ul className="space-y-4">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="block text-base font-medium text-zinc-300 hover:text-white"
                      onClick={() => setMenuState(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="outline" className="rounded-full border-white/15">
                  <Link href="/dashboard" onClick={() => setMenuState(false)}>
                    Dashboard
                  </Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/dashboard" onClick={() => setMenuState(false)}>
                    Start Free
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
