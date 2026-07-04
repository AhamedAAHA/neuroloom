"use client";

import { useEffect, useRef, useState } from "react";
import { ControlAction, ControlSettings, GestureId } from "@/lib/control-settings";

type Landmark = { x: number; y: number; z?: number };

const FINGER_TIPS = [4, 8, 12, 16, 20] as const;
const FINGER_PIPS = [3, 6, 10, 14, 18] as const;

function dist(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fingerExtended(landmarks: Landmark[], tipIdx: number, pipIdx: number, isThumb: boolean) {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  if (isThumb) return tip.x < pip.x - 0.04;
  return tip.y < pip.y - 0.02;
}

export function detectGesture(landmarks: Landmark[]): GestureId | null {
  const extended = FINGER_TIPS.map((tip, i) =>
    fingerExtended(landmarks, tip, FINGER_PIPS[i], i === 0)
  );
  const count = extended.filter(Boolean).length;
  const pinch = dist(landmarks[4], landmarks[8]) < 0.05;

  if (pinch && count <= 2) return "pinch";
  if (count >= 4) return "open_palm";
  if (count === 0) return "fist";
  if (extended[0] && count === 1) return "thumbs_up";
  if (extended[1] && extended[2] && count === 2) return "peace";
  if (extended[1] && count === 1) return "point";
  return null;
}

type HandLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, time: number) => { landmarks?: Landmark[][] };
  close: () => void;
};

async function createHandLandmarker() {
  const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  const options = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode: "VIDEO" as const,
    numHands: 1,
  };

  try {
    return (await HandLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: "GPU" },
    })) as HandLandmarkerInstance;
  } catch {
    return (await HandLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: "CPU" },
    })) as HandLandmarkerInstance;
  }
}

export function useHandGestures(
  settings: ControlSettings,
  onAction: (action: ControlAction, gesture: GestureId) => void
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarkerInstance | null>(null);
  const rafRef = useRef<number>(0);
  const lastGestureRef = useRef<{ g: GestureId; t: number } | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const [active, setActive] = useState(false);
  const [gesture, setGesture] = useState<GestureId | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!settings.handEnabled) {
      setActive(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const landmarker = await createHandLandmarker();
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          landmarker.close();
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setActive(true);
        setReady(true);
        setError("");

        const loop = () => {
          if (!landmarkerRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          const vid = videoRef.current;
          const now = performance.now();
          const result = landmarkerRef.current.detectForVideo(vid, now);
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");

          if (canvas && ctx) {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          if (result.landmarks?.[0]) {
            const lm = result.landmarks[0];
            const g = detectGesture(lm);
            setGesture(g);

            if (ctx && canvas) {
              ctx.fillStyle = "#4ecdc4";
              lm.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
                ctx.fill();
              });
            }

            if (g) {
              const action = settings.gestureMap[g];
              const last = lastGestureRef.current;
              const cooldown = 1800;
              if (!last || last.g !== g || now - last.t > cooldown) {
                lastGestureRef.current = { g, t: now };
                onActionRef.current(action, g);
              }
            }
          } else {
            setGesture(null);
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Camera access denied");
        setActive(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      const video = videoRef.current;
      const stream = video?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setActive(false);
      setReady(false);
    };
  }, [settings.handEnabled, settings.gestureMap]);

  return { videoRef, canvasRef, active, gesture, error, ready };
}
