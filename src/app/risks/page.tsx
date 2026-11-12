"use client";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RiskDetailSheet } from "@/components/risk-detail-sheet";
import { RiskStatusBadge } from "@/components/status-badges";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/store";
import type { Risk, RiskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function RisksPage() {
  return (
    <WorkspaceReady>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <RisksBody />
      </Suspense>
    </WorkspaceReady>
  );
}

function RisksBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { risks, meetings, tasks, updateRiskStatus } = useWorkspace();
  const selectedId = searchParams.get("id");
  const selected = risks.find((item) => item.id === selectedId);

  const ordered = [...risks].sort((a, b) => {
    const rank = { open: 0, monitoring: 1, resolved: 2 };
    return rank[a.status] - rank[b.status];
  });

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        kicker="Watchlist"
        title="Risks and blockers"
        description="The Risk agent flags slippage, dependencies, and unresolved questions from the transcript. Status is yours to update."
      />

      {ordered.length ? (
        <ul className="space-y-3">
          {ordered.map((risk) => (
            <RiskRow
              key={risk.id}
              risk={risk}
              meetingTitle={meetings.find((meeting) => meeting.id === risk.meetingId)?.title}
              taskTitle={tasks.find((task) => task.id === risk.relatedTaskId)?.title}
              onOpen={() => router.push(`/risks?id=${risk.id}`)}
              onStatus={updateRiskStatus}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<AlertTriangleIcon className="size-4" />}
          title="No active risks"
          description="MinuteMind hasn't detected any unresolved blockers."
          action={
            <Button render={<Link href="/meetings/new" />}>Process a meeting</Button>
          }
        />
      )}

      <RiskDetailSheet
        risk={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("id");
            const query = next.toString();
            router.push(query ? `/risks?${query}` : "/risks");
          }
        }}
      />
    </div>
  );
}

function RiskRow({
  risk,
  meetingTitle,
  taskTitle,
  onOpen,
  onStatus,
}: {
  risk: Risk;
  meetingTitle?: string;
  taskTitle?: string;
  onOpen: () => void;
  onStatus: (id: string, status: RiskStatus) => void;
}) {
  return (
    <li
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4 shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)] transition-transform duration-200 hover:-translate-y-0.5",
        risk.status === "open" && "border-l-[3px] border-l-red-500",
        risk.status === "monitoring" && "border-l-[3px] border-l-amber-500",
        risk.status === "resolved" && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-md text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 font-heading text-lg leading-snug break-words">{risk.description}</p>
            <RiskStatusBadge status={risk.status} />
          </div>
          {risk.sourceQuote ? (
            <p className="mt-2 line-clamp-2 border-l-2 border-brass/50 pl-2.5 text-sm leading-6 text-foreground/85">
              “{risk.sourceQuote}”
            </p>
          ) : null}
          <p className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {meetingTitle ? (
              <span className="rounded-full border border-border/70 bg-paper px-2 py-0.5 break-words">
                {meetingTitle}
              </span>
            ) : null}
            <span className="text-brass" aria-hidden>
              →
            </span>
            <span className="rounded-full border border-primary/20 bg-white px-2 py-0.5">Risk</span>
            {taskTitle ? (
              <>
                <span className="text-brass" aria-hidden>
                  →
                </span>
                <span className="rounded-full border border-border/70 bg-paper px-2 py-0.5 break-words">
                  {taskTitle}
                </span>
              </>
            ) : null}
          </p>
          <p className="mt-2 min-w-0 text-xs break-words text-muted-foreground">
            {risk.raisedBy ? `Raised by ${risk.raisedBy}` : "Speaker not labelled"}
          </p>
        </button>
        <div className="flex flex-wrap gap-1.5">
          {risk.status !== "monitoring" && risk.status !== "resolved" ? (
            <Button size="sm" variant="outline" onClick={() => onStatus(risk.id, "monitoring")}>
              Monitor
            </Button>
          ) : null}
          {risk.status !== "resolved" ? (
            <Button size="sm" onClick={() => onStatus(risk.id, "resolved")}>
              Resolve
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onStatus(risk.id, "open")}>
              Reopen
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
