"use client";

import { EmptyState } from "@/components/empty-state";
import { FollowUpActions } from "@/components/follow-up-actions";
import { FollowUpDetailSheet } from "@/components/follow-up-detail-sheet";
import { OwnerLabel } from "@/components/owner-label";
import { PageHeader } from "@/components/page-header";
import { FollowUpBadge } from "@/components/status-badges";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { formatRelativeDay, isOverdue } from "@/lib/dates";
import { followUpKindLabel, followUpStatusLabel } from "@/lib/format";
import { useWorkspace } from "@/lib/store";
import type { FollowUp, FollowUpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarCheckIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

const FILTERS = ["all", "overdue", "scheduled", "sent", "done"] as const;

export default function FollowUpsPage() {
  return (
    <WorkspaceReady>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <FollowUpsBody />
      </Suspense>
    </WorkspaceReady>
  );
}

function FollowUpsBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { followUps, meetings, tasks, updateFollowUpStatus } = useWorkspace();
  const filter = (searchParams.get("filter") as (typeof FILTERS)[number] | null) ?? "all";
  const selectedId = searchParams.get("id");

  const visible = useMemo(() => {
    return [...followUps]
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
      .filter((item) => {
        const overdue = isOverdue(item.scheduledFor) && item.status !== "done";
        if (filter === "all") return true;
        if (filter === "overdue") return overdue;
        if (filter === "done") return item.status === "done";
        if (filter === "sent") return item.status === "sent" || item.status === "acknowledged";
        return item.status === "scheduled" && !overdue;
      });
  }, [filter, followUps]);

  const selected = followUps.find((item) => item.id === selectedId);

  function setFilter(next: (typeof FILTERS)[number]) {
    router.push(next === "all" ? "/follow-ups" : `/follow-ups?filter=${next}`);
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        kicker="Inbox"
        title="Follow-up management"
        description="Each reminder closes a loop: recap the room, check a commitment, or resolve an open question. Email draft, copy, or calendar file — you send it. MinuteMind does not send mail."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? "default" : "outline"}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item === "all"
              ? "All"
              : item === "overdue"
                ? "Overdue"
                : followUpStatusLabel(item)}
          </Button>
        ))}
      </div>

      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((item) => (
            <FollowUpRow
              key={item.id}
              item={item}
              meetingTitle={meetings.find((meeting) => meeting.id === item.meetingId)?.title}
              taskTitle={tasks.find((task) => task.id === item.taskId)?.title}
              onStatus={updateFollowUpStatus}
              onOpen={() => router.push(`/follow-ups?id=${item.id}`)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<CalendarCheckIcon className="size-4" />}
          title={filter === "done" ? "No completed follow-ups yet." : "Nothing in this slice"}
          description={
            filter === "done"
              ? "Mark a follow-up done after the owner confirms progress."
              : "Try another filter, or process a meeting so the Follow-up agent can schedule recaps."
          }
        />
      )}

      <FollowUpDetailSheet
        item={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("id");
            const query = next.toString();
            router.push(query ? `/follow-ups?${query}` : "/follow-ups");
          }
        }}
      />
    </div>
  );
}

function FollowUpRow({
  item,
  meetingTitle,
  taskTitle,
  onStatus,
  onOpen,
}: {
  item: FollowUp;
  meetingTitle?: string;
  taskTitle?: string;
  onStatus: (id: string, status: FollowUpStatus) => void;
  onOpen: () => void;
}) {
  const overdue = isOverdue(item.scheduledFor) && item.status !== "done";

  return (
    <li
      className={cn(
        "folio p-4 transition-transform duration-200 hover:-translate-y-0.5",
        overdue && "border-l-[3px] border-l-red-500",
        item.status === "done" && "opacity-80",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-md text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg leading-snug break-words">{item.title}</h2>
            <FollowUpBadge status={item.status} overdue={overdue} />
          </div>
          <p className="mt-1 text-xs font-medium text-brass">
            {followUpKindLabel(item.kind)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {taskTitle
              ? `Checking commitment: ${taskTitle}`
              : item.kind === "recap"
                ? "Checking that attendees receive the minutes."
                : item.note}
          </p>
          {meetingTitle ? (
            <p className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-paper px-2 py-0.5 break-words">
                {meetingTitle}
              </span>
              <span className="text-brass" aria-hidden>
                →
              </span>
              <span className="rounded-full border border-border/70 bg-paper px-2 py-0.5 break-words">
                {taskTitle ?? "Minutes recap"}
              </span>
              <span className="text-brass" aria-hidden>
                →
              </span>
              <span className="rounded-full border border-primary/20 bg-white px-2 py-0.5">
                Follow-up
              </span>
            </p>
          ) : null}
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <OwnerLabel owner={item.recipient} />
            <span>{formatRelativeDay(item.scheduledFor)}</span>
          </div>
        </button>
        <div className="flex flex-wrap gap-1.5">
          <FollowUpActions item={item} />
          {item.status !== "sent" && item.status !== "done" ? (
            <Button size="sm" variant="outline" onClick={() => onStatus(item.id, "sent")}>
              Mark sent
            </Button>
          ) : null}
          {item.status === "sent" ? (
            <Button size="sm" variant="outline" onClick={() => onStatus(item.id, "acknowledged")}>
              Acknowledged
            </Button>
          ) : null}
          {item.status !== "done" ? (
            <Button size="sm" onClick={() => onStatus(item.id, "done")}>
              Done
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onStatus(item.id, "scheduled")}>
              Reopen
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
