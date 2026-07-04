"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Call, Heart, Moon, Sun1, TickCircle } from "iconsax-react";
import { api } from "@/lib/api";
import { BRAND, BrandLogo } from "@/lib/icons";

function SeniorViewContent() {
  const params = useSearchParams();
  const circleId = params.get("circle") || "";
  const [mood, setMood] = useState(4);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!circleId) return;
    await api.createCheckIn(circleId, { mood, notes: "Senior view check-in" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const moods = [
    { value: 1, emoji: "😔", label: "Not great" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "🙂", label: "Fine" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <BrandLogo size={72} />
        <h1 className="senior-text font-bold mt-6">How are you today?</h1>
        <p className="text-muted-foreground mt-2 senior-text">Tap how you&apos;re feeling</p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-w-lg w-full mb-10">
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            className={`senior-btn flex flex-col items-center justify-center rounded-2xl transition ${
              mood === m.value
                ? "bg-[#4ecdc4]/20 border-2 border-[#4ecdc4]"
                : "card hover:bg-white/[0.06]"
            }`}
          >
            <span className="text-4xl">{m.emoji}</span>
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={!circleId}
        className="senior-btn w-full max-w-lg rounded-2xl bg-[#ff6b6b] font-bold hover:bg-[#ff8e8e] disabled:opacity-50 transition flex items-center justify-center gap-3"
      >
        {submitted ? (
          <>
            <TickCircle size={28} color="#fff" variant="Bold" />
            Sent to family!
          </>
        ) : (
          <>
            <Heart size={24} color="#fff" variant="Bulk" />
            Send to my family
          </>
        )}
      </button>

      <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg w-full">
        <button className="senior-btn card flex flex-col items-center justify-center gap-2 py-6">
          <Sun1 size={32} color="#fbbf24" variant="Bulk" />
          <span className="text-sm">Morning meds</span>
        </button>
        <button className="senior-btn card flex flex-col items-center justify-center gap-2 py-6">
          <Moon size={32} color="#a78bfa" variant="Bulk" />
          <span className="text-sm">Evening meds</span>
        </button>
        <button className="senior-btn card flex flex-col items-center justify-center gap-2 py-6">
          <Call size={32} color={BRAND.teal} variant="Bulk" />
          <span className="text-sm">Call family</span>
        </button>
      </div>

      {!circleId && (
        <p className="text-[#ff6b6b] mt-6 text-center text-sm">Add ?circle=YOUR_ID to the URL</p>
      )}

      <Link
        href={circleId ? `/dashboard/${circleId}` : "/onboarding"}
        className="mt-8 text-sm text-muted-foreground hover:text-white transition"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}

export default function SeniorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center gap-2">
          <Heart size={24} color={BRAND.teal} className="animate-pulse" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <SeniorViewContent />
    </Suspense>
  );
}
