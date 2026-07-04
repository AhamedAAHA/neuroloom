export type TabId =
  | "overview"
  | "meds"
  | "documents"
  | "handoffs"
  | "checkins"
  | "tasks"
  | "emergency"
  | "settings";

export type ControlAction =
  | `tab_${TabId}`
  | "action_analyze_meds"
  | "action_handoff"
  | "action_checkin"
  | "action_emergency"
  | "action_help";

export type GestureId = "open_palm" | "fist" | "point" | "thumbs_up" | "peace" | "pinch";

export const TAB_LABELS: Record<TabId, string> = {
  overview: "Command Center",
  meds: "MedGuard",
  documents: "Vault",
  handoffs: "Handoffs",
  checkins: "Check-ins",
  tasks: "Family Sync",
  emergency: "Emergency",
  settings: "Settings",
};

export const ACTION_LABELS: Record<ControlAction, string> = {
  tab_overview: "Open Command Center",
  tab_meds: "Open MedGuard",
  tab_documents: "Open Vault",
  tab_handoffs: "Open Handoffs",
  tab_checkins: "Open Check-ins",
  tab_tasks: "Open Family Sync",
  tab_emergency: "Open Emergency",
  tab_settings: "Open Settings",
  action_analyze_meds: "Analyze medications",
  action_handoff: "Generate handoff",
  action_checkin: "Submit check-in",
  action_emergency: "Generate emergency pack",
  action_help: "Show voice help",
};

export const GESTURE_LABELS: Record<GestureId, string> = {
  open_palm: "Open palm ✋",
  fist: "Closed fist ✊",
  point: "Index point ☝",
  thumbs_up: "Thumbs up 👍",
  peace: "Peace sign ✌",
  pinch: "Pinch 🤏",
};

export type ControlSettings = {
  voiceEnabled: boolean;
  handEnabled: boolean;
  voiceLang: string;
  voicePhrases: Record<ControlAction, string[]>;
  gestureMap: Record<GestureId, ControlAction>;
};

export const DEFAULT_VOICE_PHRASES: Record<ControlAction, string[]> = {
  tab_overview: ["command center", "overview", "home", "dashboard"],
  tab_meds: ["medications", "med guard", "medguard", "meds"],
  tab_documents: ["documents", "vault", "files"],
  tab_handoffs: ["handoffs", "handoff", "shift"],
  tab_checkins: ["check in", "checkins", "mood"],
  tab_tasks: ["tasks", "family sync", "todo"],
  tab_emergency: ["emergency", "urgent", "sos"],
  tab_settings: ["settings", "preferences", "options"],
  action_analyze_meds: ["analyze medications", "analyze meds", "extract meds"],
  action_handoff: ["create handoff", "generate handoff"],
  action_checkin: ["submit check in", "save check in"],
  action_emergency: ["generate emergency", "emergency pack"],
  action_help: ["help", "what can I say", "commands"],
};

export const DEFAULT_GESTURE_MAP: Record<GestureId, ControlAction> = {
  open_palm: "tab_overview",
  point: "tab_meds",
  peace: "tab_emergency",
  thumbs_up: "action_analyze_meds",
  pinch: "action_handoff",
  fist: "tab_handoffs",
};

export const DEFAULT_SETTINGS: ControlSettings = {
  voiceEnabled: false,
  handEnabled: false,
  voiceLang: "en-US",
  voicePhrases: DEFAULT_VOICE_PHRASES,
  gestureMap: DEFAULT_GESTURE_MAP,
};

const STORAGE_KEY = "neuroloom_control_settings";

export function loadControlSettings(): ControlSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveControlSettings(settings: ControlSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function actionToTab(action: ControlAction): TabId | null {
  if (!action.startsWith("tab_")) return null;
  return action.replace("tab_", "") as TabId;
}
