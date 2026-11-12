"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/lib/store";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <WorkspaceProvider>
        {children}
        <Toaster />
      </WorkspaceProvider>
    </TooltipProvider>
  );
}
