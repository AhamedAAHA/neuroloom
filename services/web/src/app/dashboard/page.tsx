"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSavedCircleId, clearCircleSession } from "@/lib/circle-session";
import { api } from "@/lib/api";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const id = getSavedCircleId();
    if (!id) {
      router.replace("/onboarding");
      return;
    }

    api
      .getCircle(id)
      .then(() => router.replace(`/dashboard/${id}`))
      .catch(() => {
        clearCircleSession();
        router.replace("/onboarding");
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Opening your care circle…
    </div>
  );
}
