"use client";

import { useWorkspace } from "@/lib/store";
import type { ReactNode } from "react";

export function WorkspaceReady({ children }: { children: ReactNode }) {
  const { ready } = useWorkspace();

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return children;
}
