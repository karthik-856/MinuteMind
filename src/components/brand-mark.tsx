"use client";

import { Feather3D } from "@/components/feather-3d";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-white/18 to-white/6 shadow-[inset_0_1px_0_oklch(1_0_0/0.22)] ring-1 ring-white/15",
        className,
      )}
      aria-hidden
    >
      <Feather3D size="mark" floating={false} tone="night" className="translate-y-0.5" />
    </span>
  );
}
