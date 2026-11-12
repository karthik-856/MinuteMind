"use client";

import { FeatherSvg } from "@/components/feather-svg";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useId } from "react";

const FLOCK = [
  { top: "10%", left: "8%", delay: "0s", duration: "16s", scale: 0.65, rotate: -18 },
  { top: "22%", left: "72%", delay: "1.4s", duration: "18s", scale: 0.8, rotate: 16 },
  { top: "48%", left: "78%", delay: "2.8s", duration: "14s", scale: 0.5, rotate: -8 },
  { top: "64%", left: "10%", delay: "0.8s", duration: "20s", scale: 0.7, rotate: 12 },
  { top: "78%", left: "62%", delay: "3.2s", duration: "17s", scale: 0.55, rotate: -14 },
];

export function FeatherField({
  className,
  density = "workspace",
}: {
  className?: string;
  density?: "workspace" | "hero";
}) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const flock = density === "hero" ? FLOCK.slice(0, 3) : FLOCK;

  if (reduced) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        density === "workspace" && "hidden sm:block",
        className,
      )}
      aria-hidden
    >
      {flock.map((feather, index) => (
        <div
          key={index}
          className="absolute h-20 w-8 opacity-25"
          style={{
            top: feather.top,
            left: feather.left,
            animation: `feather-drift ${feather.duration} ${feather.delay} ease-in-out infinite`,
            transform: `scale(${feather.scale}) rotate(${feather.rotate}deg)`,
          }}
        >
          <FeatherSvg uid={`${uid}-${index}`} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
