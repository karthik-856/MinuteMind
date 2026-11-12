"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

const GLOBAL_STEPS = [
  { label: "Transcript", href: "/meetings/new" },
  { label: "Minutes", href: "/meetings" },
  { label: "Decisions", href: "/meetings" },
  { label: "Tasks", href: "/tasks" },
  { label: "Risks", href: "/risks" },
  { label: "Follow-ups", href: "/follow-ups" },
];

export function FlowRibbon({
  meetingId,
  signature = false,
}: {
  meetingId?: string;
  signature?: boolean;
}) {
  const steps = meetingId
    ? [
        { label: "Transcript", href: `/meetings/${meetingId}?tab=transcript` },
        { label: "Minutes", href: `/meetings/${meetingId}?tab=minutes` },
        { label: "Decisions", href: `/meetings/${meetingId}?tab=minutes` },
        { label: "Tasks", href: `/meetings/${meetingId}?tab=tasks` },
        { label: "Risks", href: `/meetings/${meetingId}?tab=risks` },
        { label: "Follow-ups", href: `/meetings/${meetingId}?tab=followups` },
      ]
    : GLOBAL_STEPS;

  return (
    <ol
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1.5",
        signature &&
          "rounded-2xl border border-brass/30 bg-white/70 px-3 py-2.5 shadow-[inset_0_1px_0_oklch(1_0_0/0.7),0_8px_22px_oklch(0.28_0.03_240/0.05)] sm:px-4 sm:py-3",
      )}
    >
      {steps.map((step, index) => (
        <li key={`${step.label}-${step.href}`} className="flex min-w-0 items-center gap-1.5">
          <Link
            href={step.href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium shadow-[0_1px_0_oklch(1_0_0/0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white hover:text-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
              signature
                ? "border-primary/25 bg-white px-3.5 py-1.5 text-[13px] text-foreground"
                : "border-primary/18 bg-white/75 text-foreground/80",
            )}
          >
            {step.label}
          </Link>
          {index < steps.length - 1 ? (
            <span
              className={cn(
                "text-brass",
                signature ? "text-sm font-medium sm:inline" : "hidden text-brass/80 sm:inline",
              )}
              aria-hidden
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
