"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ControlSettings,
  DEFAULT_SETTINGS,
  loadControlSettings,
  saveControlSettings,
} from "@/lib/control-settings";

export function useControlSettings() {
  const [settings, setSettingsState] = useState<ControlSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettingsState(loadControlSettings());
    setLoaded(true);
  }, []);

  const setSettings = useCallback((patch: Partial<ControlSettings> | ((s: ControlSettings) => ControlSettings)) => {
    setSettingsState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      saveControlSettings(next);
      return next;
    });
  }, []);

  return { settings, setSettings, loaded };
}
