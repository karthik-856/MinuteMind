"use client";

import { FeatherSvg } from "@/components/feather-svg";
import { cn } from "@/lib/utils";
import { useId } from "react";

export function Feather3D({
  rotateX = 0,
  rotateY = 0,
  size = "hero",
  floating = true,
  tone = "day",
  className,
}: {
  rotateX?: number;
  rotateY?: number;
  size?: "hero" | "ambient" | "mark";
  floating?: boolean;
  tone?: "day" | "night";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const sizes = {
    hero: "h-[22rem] w-36 sm:h-[26rem] sm:w-40",
    ambient: "h-24 w-10",
    mark: "h-7 w-4",
  };

  return (
    <div
      className={cn("relative", sizes[size], className)}
      style={{ perspective: size === "mark" ? 200 : 900 }}
    >
      <div className={cn("absolute inset-0", floating && size !== "mark" && "feather-float")}>
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${size === "hero" ? -18 : -12}deg)`,
          }}
        >
          <div
            className="absolute inset-x-4 bottom-2 h-6 rounded-[100%] bg-sidebar/20 blur-md"
            style={{ transform: "translateZ(-36px) rotateX(70deg) scaleX(1.15)" }}
          />
          <div className="absolute inset-0" style={{ transform: "translateZ(-22px) scale(1.04)" }}>
            <FeatherSvg uid={`${uid}-back`} className="h-full w-full opacity-45" tone={tone} />
          </div>
          <div className="absolute inset-0" style={{ transform: "translateZ(0px)" }}>
            <FeatherSvg uid={`${uid}-mid`} className="h-full w-full drop-shadow-sm" tone={tone} />
          </div>
          <div className="absolute inset-0" style={{ transform: "translateZ(18px) scale(0.96)" }}>
            <FeatherSvg uid={`${uid}-front`} className="h-full w-full opacity-50 mix-blend-screen" tone={tone} />
          </div>
        </div>
      </div>
    </div>
  );
}
