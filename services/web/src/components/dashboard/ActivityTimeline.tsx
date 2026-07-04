"use client";

import { ActivityItem } from "@/lib/api";
import { BRAND } from "@/lib/icons";
import {
  Activity,
  DocumentText,
  Health,
  Heart,
  People,
  TaskSquare,
} from "iconsax-react";

const TYPE_META: Record<
  ActivityItem["type"],
  { icon: React.ReactNode; color: string; label: string }
> = {
  medication: {
    icon: <Health size={16} color={BRAND.teal} variant="Bulk" />,
    color: BRAND.teal,
    label: "Medication",
  },
  checkin: {
    icon: <Heart size={16} color="#f472b6" variant="Bulk" />,
    color: "#f472b6",
    label: "Check-in",
  },
  handoff: {
    icon: <People size={16} color="#ff8e8e" variant="Bulk" />,
    color: "#ff8e8e",
    label: "Handoff",
  },
  document: {
    icon: <DocumentText size={16} color="#a78bfa" variant="Bulk" />,
    color: "#a78bfa",
    label: "Document",
  },
  task: {
    icon: <TaskSquare size={16} color="#34d399" variant="Bulk" />,
    color: "#34d399",
    label: "Task",
  },
  agent: {
    icon: <Activity size={16} color="#60a5fa" variant="Bulk" />,
    color: "#60a5fa",
    label: "Agent",
  },
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-sm font-medium">
        <Activity size={18} color={BRAND.teal} variant="Bulk" />
        Activity Timeline
      </div>
      <div className="p-4 space-y-0 max-h-80 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No activity yet — agents will log events here.</p>
        )}
        {items.map((item, idx) => {
          const meta = TYPE_META[item.type];
          return (
            <div key={`${item.type}-${item.id}`} className="flex gap-3 relative pb-4">
              {idx < items.length - 1 && (
                <span className="absolute left-[11px] top-7 bottom-0 w-px bg-white/10" aria-hidden />
              )}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                style={{ borderColor: `${meta.color}40`, backgroundColor: `${meta.color}15` }}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(item.timestamp)}</span>
                </div>
                <div className="text-sm font-medium truncate">{item.title}</div>
                {item.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.detail}</p>
                )}
                {item.meta?.pipeline && (
                  <p className="text-[10px] text-[#4ecdc4] mt-1 font-mono">
                    {(item.meta.pipeline as string[]).join(" → ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
