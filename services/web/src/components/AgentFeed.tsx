"use client";

import { AgentRun } from "@/lib/api";
import { AgentIcon, BRAND } from "@/lib/icons";
import { Activity, Refresh, TickCircle, Warning2 } from "iconsax-react";

const AGENT_COLORS: Record<string, string> = {
  Conductor: BRAND.coral,
  MedGuard: BRAND.teal,
  DocumentVault: "#a78bfa",
  Handoff: "#ff8e8e",
  ScheduleKeeper: "#fbbf24",
  EmergencyPack: "#ef4444",
  FamilySync: "#34d399",
  TrendAnalyst: "#60a5fa",
  CheckIn: "#f472b6",
};

export default function AgentFeed({ agents }: { agents: AgentRun[] }) {
  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
        <Activity size={20} color={BRAND.teal} variant="Bulk" />
        <span className="font-semibold text-sm">Live Agent Feed</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-[#4ecdc4] animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {agents.length === 0 && (
          <div className="text-center py-12">
            <Activity size={40} color="#8b9cb3" variant="TwoTone" className="mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#8b9cb3]">Agents will appear here as they work</p>
          </div>
        )}
        {agents.map((a, i) => (
          <div key={`${a.id}-${i}`} className="card p-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon status={a.status} agent={a.agent_name} />
              <AgentIcon name={a.agent_name} size={18} />
              <span
                className="font-medium text-xs flex-1 truncate"
                style={{ color: AGENT_COLORS[a.agent_name.replace(/\s/g, "")] || AGENT_COLORS[a.agent_name] || "#8b9cb3" }}
              >
                {a.agent_name}
              </span>
              <span className="text-[10px] text-[#8b9cb3] shrink-0">{a.model_route}</span>
            </div>
            <p className="text-[#8b9cb3] text-xs leading-relaxed">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status, agent }: { status: string; agent: string }) {
  const color = AGENT_COLORS[agent.replace(/\s/g, "")] || "#8b9cb3";
  if (status === "running")
    return <Refresh size={16} color={color} className="animate-spin shrink-0" />;
  if (status === "complete") return <TickCircle size={16} color={color} variant="Bold" className="shrink-0" />;
  if (status === "error") return <Warning2 size={16} color="#ef4444" variant="Bold" className="shrink-0" />;
  return <Activity size={16} color={color} variant="Linear" className="shrink-0" />;
}
