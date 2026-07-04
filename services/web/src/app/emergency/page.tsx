"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft2, Shield, Warning2 } from "iconsax-react";
import { BRAND } from "@/lib/icons";

function EmergencyContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const pin = params.get("pin") || "";
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !pin) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/emergency/${token}?pin=${pin}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.detail) setError(d.detail);
        else setContent(d.content);
      })
      .catch(() => setError("Failed to load emergency pack"));
  }, [token, pin]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-8">
          <ArrowLeft2 size={18} color="currentColor" />
          Neuroloom
        </Link>

        <div className="card p-8 border-[#ff6b6b]/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#ff6b6b]/15 flex items-center justify-center">
              <Warning2 size={32} color={BRAND.coral} variant="Bold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#ff6b6b]">Emergency Care Packet</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Shield size={14} color="#8b9cb3" />
                Coordination only — not medical advice
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[#ff6b6b]/10 text-[#ff6b6b] text-sm mb-4">{error}</div>
          )}

          {!token && !pin && (
            <p className="text-muted-foreground text-sm">
              Open with ?token=...&pin=... from your emergency pack link.
            </p>
          )}

          <pre className="whitespace-pre-wrap text-[#f7f4ef] font-sans leading-relaxed text-sm">{content}</pre>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Warning2 size={32} color={BRAND.coral} className="animate-pulse" />
        </div>
      }
    >
      <EmergencyContent />
    </Suspense>
  );
}
