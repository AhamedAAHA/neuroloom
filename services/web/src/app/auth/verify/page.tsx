"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart } from "iconsax-react";
import { api } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-session";
import { saveCircleSession } from "@/lib/circle-session";
import { BRAND } from "@/lib/icons";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing token");
      return;
    }
    api
      .verifyMagicLink(token)
      .then((res) => {
        saveAuthSession({
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          token: res.access_token,
        });
        const circle = res.circles[0];
        if (circle) {
          saveCircleSession(circle.circle_id);
          router.replace(`/dashboard/${circle.circle_id}`);
        } else {
          router.replace("/onboarding");
        }
      })
      .catch(() => setError("Invalid or expired link. Request a new one."));
  }, [params, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-[#ff8e8e]">{error}</p>
        <a href="/login" className="text-[#4ecdc4] text-sm hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center gap-2">
      <Heart size={24} color={BRAND.teal} className="animate-pulse" />
      <span className="text-muted-foreground">Signing you in...</span>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyContent />
    </Suspense>
  );
}
