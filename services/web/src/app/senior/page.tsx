"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Call, Heart, Moon, Sun1, TickCircle, Warning2 } from "iconsax-react";
import { api, Medication } from "@/lib/api";
import { getSavedCircleId } from "@/lib/circle-session";
import { BRAND, BrandLogo } from "@/lib/icons";

function SeniorViewContent() {
  const params = useSearchParams();
  const [circleId, setCircleId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [primaryContact, setPrimaryContact] = useState<{ name: string; email: string } | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [mood, setMood] = useState(4);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = params.get("circle") || getSavedCircleId() || "";
    setCircleId(id);
  }, [params]);

  useEffect(() => {
    if (!circleId) return;
    api.getCircle(circleId).then((c) => {
      const recipient = c.recipient as { name?: string } | null;
      setRecipientName(recipient?.name || "there");
      const members = (c.members as Array<{ name: string; email: string; role: string }>) || [];
      const primary = members.find((m) => m.role === "primary") || members[0];
      if (primary) setPrimaryContact({ name: primary.name, email: primary.email });
    });
    api.getMedications(circleId).then(setMeds).catch(() => setMeds([]));
  }, [circleId]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const submitCheckIn = useCallback(async () => {
    if (!circleId) return;
    setLoading(true);
    try {
      await api.createCheckIn(circleId, { mood, notes: "Senior view check-in" });
      setSubmitted(true);
      flash("Check-in sent to your family!");
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      flash("Could not send — try again");
    } finally {
      setLoading(false);
    }
  }, [circleId, mood]);

  const logMeds = async (period: "morning" | "evening") => {
    if (!circleId) return;
    setLoading(true);
    try {
      await api.createCheckIn(circleId, {
        mood,
        notes: `${period === "morning" ? "Morning" : "Evening"} medications taken`,
      });
      flash(`${period === "morning" ? "Morning" : "Evening"} meds logged!`);
    } catch {
      flash("Could not log — try again");
    } finally {
      setLoading(false);
    }
  };

  const moods = [
    { value: 1, emoji: "😔", label: "Not great" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "🙂", label: "Fine" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "😄", label: "Great" },
  ];

  const morningMeds = meds.filter((m) => /morning|am|08|breakfast/i.test(m.schedule));
  const eveningMeds = meds.filter((m) => /evening|pm|20|night|bed/i.test(m.schedule));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <BrandLogo size={72} />
        <h1 className="senior-text font-bold mt-6">Hi, {recipientName}!</h1>
        <p className="text-muted-foreground mt-2 senior-text">How are you feeling today?</p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-w-lg w-full mb-8">
        {moods.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMood(m.value)}
            aria-label={m.label}
            className={`senior-btn flex flex-col items-center justify-center rounded-2xl transition min-h-[72px] ${
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
        type="button"
        onClick={submitCheckIn}
        disabled={!circleId || loading}
        className="senior-btn w-full max-w-lg rounded-2xl bg-[#ff6b6b] font-bold hover:bg-[#ff8e8e] disabled:opacity-50 transition flex items-center justify-center gap-3 min-h-[64px] text-lg"
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

      {feedback && (
        <p className="mt-4 text-[#4ecdc4] text-center senior-text">{feedback}</p>
      )}

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
        <button
          type="button"
          onClick={() => logMeds("morning")}
          disabled={!circleId || loading}
          className="senior-btn card flex flex-col items-center justify-center gap-2 py-8 min-h-[120px] hover:bg-[#fbbf24]/10 transition"
        >
          <Sun1 size={36} color="#fbbf24" variant="Bulk" />
          <span className="text-base font-medium">Morning meds</span>
          {morningMeds.length > 0 && (
            <span className="text-xs text-muted-foreground">{morningMeds.map((m) => m.name).join(", ")}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => logMeds("evening")}
          disabled={!circleId || loading}
          className="senior-btn card flex flex-col items-center justify-center gap-2 py-8 min-h-[120px] hover:bg-[#a78bfa]/10 transition"
        >
          <Moon size={36} color="#a78bfa" variant="Bulk" />
          <span className="text-base font-medium">Evening meds</span>
          {eveningMeds.length > 0 && (
            <span className="text-xs text-muted-foreground">{eveningMeds.map((m) => m.name).join(", ")}</span>
          )}
        </button>
        <a
          href={primaryContact ? `mailto:${primaryContact.email}?subject=Hi from ${recipientName}` : "#"}
          className={`senior-btn card flex flex-col items-center justify-center gap-2 py-8 min-h-[120px] hover:bg-[#4ecdc4]/10 transition ${
            !primaryContact ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Call size={36} color={BRAND.teal} variant="Bulk" />
          <span className="text-base font-medium">Call family</span>
          {primaryContact && (
            <span className="text-xs text-muted-foreground">{primaryContact.name}</span>
          )}
        </a>
      </div>

      {!circleId && (
        <div className="mt-8 text-center space-y-2">
          <Warning2 size={24} color="#ff8e8e" className="mx-auto" />
          <p className="text-[#ff8e8e] text-sm">Open from your care circle dashboard first</p>
          <Link href="/onboarding" className="text-[#4ecdc4] text-sm hover:underline">
            Set up a care circle
          </Link>
        </div>
      )}

      <Link
        href={circleId ? `/dashboard/${circleId}` : "/dashboard"}
        className="mt-8 text-sm text-muted-foreground hover:text-white transition"
      >
        ← Family dashboard
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
