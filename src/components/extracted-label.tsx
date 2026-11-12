"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ExtractedLabel() {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="rounded-md border border-brass/30 bg-brass/8 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-brass uppercase"
      >
        Extracted
      </TooltipTrigger>
      <TooltipContent>Extracted from a spoken commitment in the meeting.</TooltipContent>
    </Tooltip>
  );
}
