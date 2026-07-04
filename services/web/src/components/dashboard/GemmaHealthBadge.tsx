"use client";

import { useEffect, useState } from "react";
import { api, GemmaHealth } from "@/lib/api";
import { BRAND } from "@/lib/icons";
import { Cpu, Flash } from "iconsax-react";

export function GemmaHealthBadge() {
  const [health, setHealth] = useState<GemmaHealth | null>(null);

  useEffect(() => {
    api.getGemmaHealth().then(setHealth).catch(() =>
      setHealth({ status: "offline", route: "gemma-amd", endpoint: "", fallback: "local-fallback" })
    );
    const id = setInterval(() => api.getGemmaHealth().then(setHealth).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, []);

  const online = health?.status === "online";

  return (
    <div
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
        online
          ? "text-[#4ecdc4] border-[#4ecdc4]/30 bg-[#4ecdc4]/10"
          : "text-amber-400 border-amber-400/30 bg-amber-400/10"
      }`}
      title={health?.endpoint ? `Gemma @ ${health.endpoint}` : "Gemma inference status"}
    >
      {online ? (
        <Flash size={14} color={BRAND.teal} variant="Bold" />
      ) : (
        <Cpu size={14} color="#fbbf24" variant="Bulk" />
      )}
      {online ? "Gemma on AMD" : `Fallback: ${health?.fallback || "local"}`}
      <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-[#4ecdc4] animate-pulse" : "bg-amber-400"}`} />
    </div>
  );
}
