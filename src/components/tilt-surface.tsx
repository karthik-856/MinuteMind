"use client";

import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function TiltSurface({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const { tilt, onPointerMove, onPointerLeave, reduced } = usePointerTilt(max);

  return (
    <div
      className={cn("min-w-0 overflow-hidden rounded-xl [perspective:900px]", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="h-full min-w-0 will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: reduced
            ? undefined
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
