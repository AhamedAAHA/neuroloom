import { cn } from "@/lib/utils";

type ProgressiveBlurProps = {
  className?: string;
  direction?: "left" | "right";
  blurIntensity?: number;
};

export function ProgressiveBlur({
  className,
  direction = "left",
  blurIntensity = 1,
}: ProgressiveBlurProps) {
  const mask =
    direction === "left"
      ? "linear-gradient(to right, black 0%, transparent 100%)"
      : "linear-gradient(to left, black 0%, transparent 100%)";

  return (
    <div
      className={cn(className)}
      style={{
        backdropFilter: `blur(${blurIntensity * 6}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity * 6}px)`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}
