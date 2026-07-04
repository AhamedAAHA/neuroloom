"use client";

import { useState } from "react";
import { AgentRun } from "@/lib/api";
import { AgentIcon, BRAND } from "@/lib/icons";
import { Activity, ArrowDown2, ArrowUp2, Refresh, TickCircle, Warning2 } from "iconsax-react";

const AGENT_COLORS: Record<string, string> = {
  Conductor: BRAND.coral,
  MedGuard: BRAND.teal,
  DocumentVault: "#a78bfa",
  Handoff: "#ff8e8e",
  ScheduleKeeper: "#fbbf24",
  EmergencyPack: "#ef4444",
  FamilySync: "#34d399",
  TrendAnalyst: "#60a5fa",
  CheckInCompanion: "#f472b6",
  CheckIn: "#f472b6",
};

function agentColor(name: string) {
  return AGENT_COLORS[name.replace(/\s/g, "")] || AGENT_COLORS[name] || "#8b9cb3";
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

export default function AgentFeed({ agents }: { agents: AgentRun[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
        <Activity size={20} color={BRAND.teal} variant="Bulk" />
        <span className="font-semibold text-sm">Agent History</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{agents.length} runs</span>
        <span className="w-2 h-2 rounded-full bg-[#4ecdc4] animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {agents.length === 0 && (
          <div className="text-center py-12">
            <Activity size={40} color="#8b9cb3" variant="TwoTone" className="mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#8b9cb3]">Agents will appear here as they work</p>
          </div>
        )}
        {agents.map((a, i) => {
          const color = agentColor(a.agent_name);
          const isOpen = expanded === a.id;
          const pipeline = a.metadata?.pipeline as string[] | undefined;
          return (
            <div key={`${a.id}-${i}`} className="card p-3 text-sm">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : a.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon status={a.status} color={color} />
                  <AgentIcon name={a.agent_name} size={18} />
                  <span className="font-medium text-xs flex-1 truncate" style={{ color }}>
                    {a.agent_name}
                  </span>
                  <span className="text-[10px] text-[#8b9cb3] shrink-0">{formatTime(a.created_at)}</span>
                  {isOpen ? (
                    <ArrowUp2 size={14} color="#8b9cb3" />
                  ) : (
                    <ArrowDown2 size={14} color="#8b9cb3" />
                  )}
                </div>
                <p className="text-[#8b9cb3] text-xs leading-relaxed">{a.message}</p>
              </button>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-[10px] text-muted-foreground">
                  <div>
                    <span className="text-foreground">Route:</span> {a.model_route}
                  </div>
                  <div>
                    <span className="text-foreground">Status:</span> {a.status}
                  </div>
                  {pipeline && pipeline.length > 0 && (
                    <div className="text-[#4ecdc4] font-mono">Pipeline: {pipeline.join(" → ")}</div>
                  )}
                  {a.metadata?.action != null ? (
                    <div>
                      <span className="text-foreground">Action:</span> {String(a.metadata.action)}
                    </div>
                  ) : null}
                  {Array.isArray(a.metadata?.alerts) && a.metadata.alerts.length > 0 ? (
                    <ul className="list-disc pl-4 text-amber-400">
                      {(a.metadata.alerts as string[]).map((alert) => (
                        <li key={alert}>{alert}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status, color }: { status: string; color: string }) {
  if (status === "running")
    return <Refresh size={16} color={color} className="animate-spin shrink-0" />;
  if (status === "complete") return <TickCircle size={16} color={color} variant="Bold" className="shrink-0" />;
  if (status === "error") return <Warning2 size={16} color="#ef4444" variant="Bold" className="shrink-0" />;
  return <Activity size={16} color={color} variant="Linear" className="shrink-0" />;
}
