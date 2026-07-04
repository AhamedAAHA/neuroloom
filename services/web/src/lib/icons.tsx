import Image from "next/image";
import {
  Cpu,
  DocumentText,
  Flash,
  Health,
  Heart,
  Hospital,
  People,
  TaskSquare,
} from "iconsax-react";

export const BRAND = {
  coral: "#ff6b6b",
  teal: "#4ecdc4",
  navy: "#09090b",
};

export const ALL_AGENTS = [
  "Conductor",
  "MedGuard",
  "Schedule Keeper",
  "Handoff",
  "Document Vault",
  "Check-in Companion",
  "Emergency Pack",
  "Family Sync",
  "Trend Analyst",
];

const AGENT_ICON_MAP: Record<string, typeof Health> = {
  Conductor: Cpu,
  MedGuard: Health,
  ScheduleKeeper: Health,
  Handoff: People,
  DocumentVault: DocumentText,
  CheckinCompanion: Heart,
  CheckInCompanion: Heart,
  EmergencyPack: Flash,
  FamilySync: TaskSquare,
  TrendAnalyst: Cpu,
};

export function AgentIcon({ name, size = 24 }: { name: string; size?: number }) {
  const key = name.replace(/\s/g, "");
  const Icon = AGENT_ICON_MAP[key] || Cpu;
  return <Icon size={size} color={BRAND.teal} variant="Bulk" />;
}

export function BrandLogo({
  size = 32,
  className,
  variant = "icon",
}: {
  size?: number;
  className?: string;
  variant?: "icon" | "full";
}) {
  if (variant === "full") {
    const height = Math.round(size * 0.28);
    const width = Math.round(height * (240 / 56));
    return (
      <Image
        src="/logo.svg"
        alt="Neuroloom"
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  }
  return (
    <Image
      src="/logo-icon.svg"
      alt="Neuroloom"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export const FEATURE_CARDS = [
  { Icon: Health, label: "MedGuard", desc: "Track medications", color: BRAND.teal },
  { Icon: People, label: "Handoffs", desc: "Shift briefings", color: BRAND.coral },
  { Icon: DocumentText, label: "Vault", desc: "Care documents", color: "#a78bfa" },
  { Icon: Flash, label: "Emergency", desc: "One-tap packets", color: "#fbbf24" },
];

export const STAT_ICONS = [
  { Icon: Health, value: "60%", label: "of seniors take 3+ medications" },
  { Icon: People, value: "4+", label: "apps families use to coordinate" },
  { Icon: Hospital, value: "72h", label: "critical post-discharge window" },
];

export const CARE_MODE_ICONS: Record<
  string,
  { Icon: typeof Health; color: string; variant?: "Bulk" | "Linear" | "Outline" | "Broken" | "Bold" | "TwoTone" }
> = {
  post_hospital: { Icon: Hospital, color: BRAND.coral },
  dementia: { Icon: Heart, color: "#a78bfa" },
  chronic: { Icon: Health, color: BRAND.teal },
  long_distance: { Icon: People, color: "#60a5fa" },
};

export { Cpu, DocumentText, Flash, Health, Category } from "iconsax-react";
