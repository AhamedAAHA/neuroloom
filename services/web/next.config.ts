import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep MediaPipe out of the SSR bundle (browser-only, loaded via dynamic import)
  serverExternalPackages: ["@mediapipe/tasks-vision"],
};

export default nextConfig;
