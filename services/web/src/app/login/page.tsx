"use client";

import { useState } from "react";
import Link from "next/link";
import { Sms, TickCircle } from "iconsax-react";
import { api } from "@/lib/api";
import { BRAND, BrandLogo } from "@/lib/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.requestMagicLink(email.trim());
      setMagicLink(res.magic_link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <BrandLogo size={56} />
      <h1 className="text-2xl font-bold mt-6">Sign in to Neuroloom</h1>
      <p className="text-muted-foreground text-sm mt-2 text-center max-w-sm">
        Enter the email you used when creating a care circle. We&apos;ll send a magic link — no password needed.
      </p>

      <form onSubmit={submit} className="w-full max-w-md mt-8 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@family.com"
          className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-[#4ecdc4] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#4ecdc4] text-[#0b1426] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sms size={20} color="#0b1426" />
          {loading ? "Creating link..." : "Send magic link"}
        </button>
      </form>

      {magicLink && (
        <div className="mt-6 w-full max-w-md card p-4 space-y-3">
          <p className="text-sm text-[#4ecdc4] flex items-center gap-2">
            <TickCircle size={18} color={BRAND.teal} variant="Bold" />
            Dev mode — click your link:
          </p>
          <Link
            href={(() => {
              try {
                const u = new URL(magicLink);
                return `${u.pathname}${u.search}`;
              } catch {
                return magicLink;
              }
            })()}
            className="text-xs break-all text-[#4ecdc4] hover:underline"
          >
            {magicLink}
          </Link>
        </div>
      )}

      {error && <p className="text-[#ff8e8e] text-sm mt-4">{error}</p>}

      <Link href="/dashboard" className="mt-8 text-sm text-muted-foreground hover:text-white">
        Continue without signing in →
      </Link>
    </div>
  );
}
