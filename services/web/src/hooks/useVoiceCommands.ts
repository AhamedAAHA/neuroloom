"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ControlAction, ControlSettings } from "@/lib/control-settings";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceCommands(
  settings: ControlSettings,
  onAction: (action: ControlAction, transcript: string) => void
) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognition | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const matchAction = useCallback(
    (text: string): ControlAction | null => {
      const normalized = text.toLowerCase().trim();
      for (const [action, phrases] of Object.entries(settings.voicePhrases) as [ControlAction, string[]][]) {
        if (phrases.some((p) => normalized.includes(p.toLowerCase()))) {
          return action;
        }
      }
      return null;
    },
    [settings.voicePhrases]
  );

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const rec = new Ctor();
    rec.lang = settings.voiceLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else setTranscript(result[0].transcript);
      }
      if (finalText) {
        setTranscript(finalText);
        const action = matchAction(finalText);
        if (action) onActionRef.current(action, finalText);
      }
    };

    rec.onend = () => {
      if (settings.voiceEnabled) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    rec.onerror = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setSupported(true);
    } catch {
      setSupported(false);
    }
  }, [matchAction, settings.voiceEnabled, settings.voiceLang]);

  useEffect(() => {
    if (settings.voiceEnabled) start();
    else stop();
    return () => {
      recRef.current?.stop();
      recRef.current = null;
    };
  }, [settings.voiceEnabled, start, stop]);

  return { listening, transcript, supported, start, stop };
}
