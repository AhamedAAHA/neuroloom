"use client";

import { useCallback, useState } from "react";
import { Microphone2, Setting2, Video, CloseCircle } from "iconsax-react";
import {
  ACTION_LABELS,
  ControlAction,
  ControlSettings,
  GESTURE_LABELS,
  GestureId,
  TAB_LABELS,
  actionToTab,
  type TabId,
} from "@/lib/control-settings";
import { useControlSettings } from "@/hooks/useControlSettings";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { useHandGestures } from "@/hooks/useHandGestures";
import { BRAND } from "@/lib/icons";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAction: (action: Exclude<ControlAction, `tab_${TabId}`>) => void;
};

export function DashboardInteractiveControls({ activeTab, onTabChange, onAction }: Props) {
  const { settings, setSettings, loaded } = useControlSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  };

  const handleControlAction = useCallback(
    (action: ControlAction, source: string) => {
      const tab = actionToTab(action);
      if (tab) {
        onTabChange(tab);
        flash(`${source}: ${TAB_LABELS[tab]}`);
        return;
      }
      onAction(action as Exclude<ControlAction, `tab_${TabId}`>);
      flash(`${source}: ${ACTION_LABELS[action]}`);
    },
    [onAction, onTabChange]
  );

  const { listening, transcript, supported: voiceSupported } = useVoiceCommands(settings, (action, t) =>
    handleControlAction(action, `Voice "${t.trim()}"`)
  );

  const { videoRef, canvasRef, active: camActive, gesture, error: camError, ready } = useHandGestures(
    settings,
    (action, g) => handleControlAction(action, GESTURE_LABELS[g])
  );

  if (!loaded) return null;

  return (
    <>
      {/* Floating control bar */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
        {feedback && (
          <div className="rounded-full border border-[#4ecdc4]/40 bg-background/95 px-4 py-2 text-xs text-[#4ecdc4] shadow-lg backdrop-blur-md">
            {feedback}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-background/90 p-2 shadow-2xl backdrop-blur-xl">
          <ControlBtn
            active={settings.voiceEnabled}
            onClick={() => setSettings({ voiceEnabled: !settings.voiceEnabled })}
            label="Voice"
            icon={<Microphone2 size={20} color={settings.voiceEnabled ? BRAND.teal : "#a1a1aa"} variant="Bulk" />}
            pulse={listening}
          />
          <ControlBtn
            active={settings.handEnabled}
            onClick={() => setSettings({ handEnabled: !settings.handEnabled })}
            label="Hands"
            icon={<Video size={20} color={settings.handEnabled ? BRAND.coral : "#a1a1aa"} variant="Bulk" />}
            pulse={camActive}
          />
          <ControlBtn
            active={settingsOpen}
            onClick={() => setSettingsOpen((o) => !o)}
            label="Options"
            icon={<Setting2 size={20} color={settingsOpen ? "#a78bfa" : "#a1a1aa"} variant="Bulk" />}
          />
        </div>
        {!voiceSupported && settings.voiceEnabled && (
          <p className="text-[10px] text-[#ff6b6b]">Voice not supported — use Chrome</p>
        )}
      </div>

      {/* Voice status */}
      {settings.voiceEnabled && (
        <div className="fixed bottom-24 left-4 z-40 max-w-xs rounded-xl border border-white/10 bg-background/90 p-3 text-xs backdrop-blur-md md:bottom-28">
          <div className="flex items-center gap-2 text-[#4ecdc4] mb-1">
            <span className={`h-2 w-2 rounded-full ${listening ? "bg-[#4ecdc4] animate-pulse" : "bg-zinc-600"}`} />
            Voice listening…
          </div>
          <p className="text-zinc-500 truncate">{transcript || 'Say "open med guard" or "emergency"'}</p>
        </div>
      )}

      {/* Hand camera preview */}
      {settings.handEnabled && (
        <div className="fixed bottom-24 right-4 z-40 w-40 overflow-hidden rounded-xl border border-white/15 bg-black shadow-xl md:w-48">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="h-auto w-full scale-x-[-1]" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-[10px]">
            {camError ? (
              <span className="text-[#ff6b6b]">{camError}</span>
            ) : ready && gesture ? (
              <span className="text-[#4ecdc4]">{GESTURE_LABELS[gesture]}</span>
            ) : (
              <span className="text-zinc-400">{ready ? "Show a gesture" : "Starting camera…"}</span>
            )}
          </div>
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
          activeTab={activeTab}
        />
      )}
    </>
  );
}

function ControlBtn({
  active,
  onClick,
  label,
  icon,
  pulse,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
        active ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"
      }`}
    >
      {icon}
      {pulse && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#4ecdc4] animate-pulse" />
      )}
    </button>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onClose,
  activeTab,
}: {
  settings: ControlSettings;
  onChange: (patch: Partial<ControlSettings> | ((s: ControlSettings) => ControlSettings)) => void;
  onClose: () => void;
  activeTab: TabId;
}) {
  const [tab, setTab] = useState<"voice" | "gesture" | "general">("voice");

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center">
      <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-0">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-card px-5 py-4">
          <h2 className="font-semibold">Control Options</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <CloseCircle size={22} color="#a1a1aa" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/10 px-4 py-2">
          {(["voice", "gesture", "general"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize ${
                tab === t ? "bg-[#4ecdc4]/15 text-[#4ecdc4]" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-5">
          {tab === "general" && (
            <>
              <Toggle
                label="Voice commands"
                checked={settings.voiceEnabled}
                onChange={(v) => onChange({ voiceEnabled: v })}
              />
              <Toggle
                label="Hand gesture control"
                checked={settings.handEnabled}
                onChange={(v) => onChange({ handEnabled: v })}
              />
              <div>
                <label className="text-xs text-zinc-400">Voice language</label>
                <select
                  value={settings.voiceLang}
                  onChange={(e) => onChange({ voiceLang: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 text-sm"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ta-IN">Tamil</option>
                </select>
              </div>
              <p className="text-xs text-zinc-500">Active tab: {TAB_LABELS[activeTab]}</p>
            </>
          )}

          {tab === "voice" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Customize voice phrases (comma-separated)</p>
              {(Object.keys(settings.voicePhrases) as ControlAction[]).map((action) => (
                <div key={action}>
                  <label className="text-[11px] text-zinc-500">{ACTION_LABELS[action]}</label>
                  <input
                    value={settings.voicePhrases[action].join(", ")}
                    onChange={(e) =>
                      onChange({
                        voicePhrases: {
                          ...settings.voicePhrases,
                          [action]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        },
                      })
                    }
                    className="mt-0.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "gesture" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Map each hand signal to an action</p>
              {(Object.keys(settings.gestureMap) as GestureId[]).map((gesture) => (
                <div key={gesture} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-zinc-300">{GESTURE_LABELS[gesture]}</span>
                  <select
                    value={settings.gestureMap[gesture]}
                    onChange={(e) =>
                      onChange({
                        gestureMap: {
                          ...settings.gestureMap,
                          [gesture]: e.target.value as ControlAction,
                        },
                      })
                    }
                    className="flex-1 rounded-lg border border-white/10 bg-background px-2 py-1.5 text-xs"
                  >
                    {(Object.keys(ACTION_LABELS) as ControlAction[]).map((a) => (
                      <option key={a} value={a}>
                        {ACTION_LABELS[a]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#4ecdc4]" : "bg-zinc-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}
