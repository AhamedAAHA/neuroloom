"use client";

import { useState } from "react";
import { useControlSettings } from "@/hooks/useControlSettings";
import {
  ACTION_LABELS,
  ControlSettings,
  DEFAULT_SETTINGS,
  GESTURE_LABELS,
  GestureId,
  TAB_LABELS,
  TabId,
  saveControlSettings,
} from "@/lib/control-settings";
import { BRAND } from "@/lib/icons";
import { Setting2, TickCircle } from "iconsax-react";

type Props = {
  careModes?: string[];
  circleName?: string;
};

export function DashboardSettings({ careModes = [], circleName }: Props) {
  const { settings, setSettings, loaded } = useControlSettings();
  const [saved, setSaved] = useState(false);

  if (!loaded) {
    return <div className="card p-6 animate-pulse h-48" />;
  }

  const update = (patch: Partial<ControlSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveControlSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Setting2 size={22} color={BRAND.teal} variant="Bulk" />
          Care Circle
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Circle name</dt>
            <dd className="font-medium">{circleName || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Care modes</dt>
            <dd className="font-medium">{careModes.length ? careModes.join(", ") : "General"}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Interactive Controls</h2>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm">Voice commands</span>
          <input
            type="checkbox"
            checked={settings.voiceEnabled}
            onChange={(e) => update({ voiceEnabled: e.target.checked })}
            className="w-5 h-5 accent-[#4ecdc4]"
          />
        </label>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm">Hand gesture controls (MediaPipe)</span>
          <input
            type="checkbox"
            checked={settings.handEnabled}
            onChange={(e) => update({ handEnabled: e.target.checked })}
            className="w-5 h-5 accent-[#4ecdc4]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground text-xs">Voice language</span>
          <select
            value={settings.voiceLang}
            onChange={(e) => update({ voiceLang: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-white/10 text-sm"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="ta-IN">Tamil</option>
            <option value="hi-IN">Hindi</option>
          </select>
        </label>
        {saved && (
          <p className="text-xs text-[#4ecdc4] flex items-center gap-1">
            <TickCircle size={14} color={BRAND.teal} variant="Bold" />
            Settings saved
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-3 text-sm">Voice phrase map</h2>
        <div className="space-y-2 text-xs text-muted-foreground max-h-48 overflow-y-auto">
          {(Object.keys(TAB_LABELS) as TabId[]).map((tab) => (
            <div key={tab}>
              <span className="text-foreground font-medium">{TAB_LABELS[tab]}:</span>{" "}
              {settings.voicePhrases[`tab_${tab}`]?.join(", ")}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-3 text-sm">Gesture map</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(Object.keys(GESTURE_LABELS) as GestureId[]).map((g) => (
            <div key={g} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{GESTURE_LABELS[g]}</span>
              <span>{ACTION_LABELS[settings.gestureMap[g]]}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => update(DEFAULT_SETTINGS)}
          className="mt-4 text-xs text-[#ff8e8e] hover:underline"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
