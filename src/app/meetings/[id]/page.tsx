"use client";

import { AgentTrace } from "@/components/agent-trace";
import { EmptyState } from "@/components/empty-state";
import { FlowRibbon } from "@/components/flow-ribbon";
import { MinutesDocument } from "@/components/minutes-document";
import { OwnerLabel } from "@/components/owner-label";
import { FollowUpBadge, PriorityBadge, RiskStatusBadge, TaskStatusBadge } from "@/components/status-badges";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatLongDate, formatRelativeDay, isOverdue } from "@/lib/dates";
import { useWorkspace } from "@/lib/store";
import { ArrowLeftIcon, CalendarCheckIcon, ClipboardListIcon, AlertTriangleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

const TABS = ["minutes", "tasks", "risks", "followups", "trace", "transcript"] as const;

export default function MeetingDetailPage() {
  return (
    <WorkspaceReady>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <MeetingDetailBody />
      </Suspense>
    </WorkspaceReady>
  );
}

function MeetingDetailBody() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { meetings, tasks, followUps, risks, deleteMeeting, processMeeting, fillGaps } =
    useWorkspace();
  const meeting = meetings.find((item) => item.id === params.id);
  const [busy, setBusy] = useState<"rerun" | "gaps" | null>(null);

  if (!meeting) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">Meeting not found</h1>
        <p className="text-sm text-muted-foreground">
          It may have been removed from this browser workspace.
        </p>
        <Button variant="outline" render={<Link href="/meetings" />}>
          Back to meetings
        </Button>
      </div>
    );
  }

  const meetingTasks = tasks.filter((task) => task.meetingId === meeting.id);
  const meetingFollowUps = followUps.filter((item) => item.meetingId === meeting.id);
  const meetingRisks = risks.filter((item) => item.meetingId === meeting.id);
  const tabParam = searchParams.get("tab");
  const tab = TABS.includes(tabParam as (typeof TABS)[number])
    ? (tabParam as (typeof TABS)[number])
    : "minutes";

  return (
    <div className="min-w-0 space-y-6">
      <section className="desk-panel px-5 py-7 sm:px-8">
        <div className="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link href="/meetings" />}>
              <ArrowLeftIcon data-icon="inline-start" />
              All meetings
            </Button>
            <p className="kicker">Source of truth</p>
            <h1 className="font-heading mt-1.5 text-3xl tracking-tight text-balance break-words sm:text-4xl">
              {meeting.title}
            </h1>
            <div className="ink-rule" />
            <p className="mt-2 text-sm text-muted-foreground">
              {formatLongDate(meeting.date)} · {meeting.durationMinutes} min ·{" "}
              {meeting.attendees.map((person) => person.name).join(", ") || "No attendees"}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This meeting is the origin of the workspace trail: minutes → decisions →
              action items → risks → follow-ups.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {meeting.minutes?.decisions.length ?? 0} decisions · {meetingTasks.length} tasks ·{" "}
              {meetingRisks.length} risks · {meetingFollowUps.length} follow-ups
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => {
                const ok = window.confirm(
                  `Re-run the local pipeline on “${meeting.title}”? Tasks, risks, and follow-ups for this meeting will be replaced. Manual status changes on those items will be lost.`,
                );
                if (!ok) return;
                setBusy("rerun");
                void processMeeting({
                  meetingId: meeting.id,
                  createdAt: meeting.createdAt,
                  title: meeting.title,
                  date: meeting.date,
                  durationMinutes: meeting.durationMinutes,
                  transcript: meeting.transcript,
                  source: meeting.source,
                })
                  .then(() => toast.success("Meeting reprocessed in place."))
                  .catch((cause) =>
                    toast.error(cause instanceof Error ? cause.message : "Re-run failed."),
                  )
                  .finally(() => setBusy(null));
              }}
            >
              {busy === "rerun" ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
              Re-run pipeline
            </Button>
            <Button
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => {
                setBusy("gaps");
                void fillGaps(meeting.id)
                  .then(({ added }) =>
                    toast.success(
                      added
                        ? `Added ${added} quote-checked item${added === 1 ? "" : "s"} from the model.`
                        : "Model found nothing extra that quoted the transcript.",
                    ),
                  )
                  .catch((cause) =>
                    toast.error(cause instanceof Error ? cause.message : "Gap fill failed."),
                  )
                  .finally(() => setBusy(null));
              }}
            >
              {busy === "gaps" ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
              Fill missed items
            </Button>
            <Button
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => {
                const ok = window.confirm(
                  `Remove “${meeting.title}” and its tasks, risks, and follow-ups from this browser workspace?`,
                );
                if (!ok) return;
                deleteMeeting(meeting.id);
                router.push("/meetings");
              }}
            >
              Remove from workspace
            </Button>
          </div>
        </div>
        <div className="relative mt-5">
          <FlowRibbon meetingId={meeting.id} signature />
        </div>
      </section>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value !== "string") return;
          const next = new URLSearchParams(searchParams.toString());
          next.set("tab", value);
          router.replace(`/meetings/${meeting.id}?${next.toString()}`, { scroll: false });
        }}
      >
        <TabsList variant="line" className="h-auto w-full min-w-0 flex-wrap justify-start">
          <TabsTrigger value="minutes" className="flex-none">Minutes</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-none">Tasks ({meetingTasks.length})</TabsTrigger>
          <TabsTrigger value="risks" className="flex-none">Risks ({meetingRisks.length})</TabsTrigger>
          <TabsTrigger value="followups" className="flex-none">Follow-ups ({meetingFollowUps.length})</TabsTrigger>
          <TabsTrigger value="trace" className="flex-none">Agent trace</TabsTrigger>
          <TabsTrigger value="transcript" className="flex-none">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="minutes" className="mt-4">
          <MinutesDocument
            meeting={meeting}
            tasks={meetingTasks}
            onTaskClick={(taskId) => router.push(`/tasks?id=${taskId}`)}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          {meetingTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => router.push(`/tasks?id=${task.id}`)}
              className="w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)] outline-none transition-transform hover:-translate-y-0.5 hover:bg-paper focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium break-words">{task.title}</p>
                <div className="flex gap-1.5">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <OwnerLabel owner={task.owner} />
                {task.dueDate ? <span>due {formatRelativeDay(task.dueDate)}</span> : null}
              </div>
            </button>
          ))}
          {!meetingTasks.length ? (
            <EmptyState
              icon={<ClipboardListIcon className="size-4" />}
              title="No action items were extracted"
              description="This transcript did not contain clear spoken commitments."
              className="py-10"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="risks" className="mt-4 space-y-3">
          {meetingRisks.map((risk) => (
            <button
              key={risk.id}
              type="button"
              onClick={() => router.push(`/risks?id=${risk.id}`)}
              className="w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)] outline-none transition-transform hover:-translate-y-0.5 hover:bg-paper focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium break-words">{risk.description}</p>
                <RiskStatusBadge status={risk.status} />
              </div>
            </button>
          ))}
          {!meetingRisks.length ? (
            <EmptyState
              icon={<AlertTriangleIcon className="size-4" />}
              title="No active risks"
              description="MinuteMind hasn't detected any unresolved blockers in this meeting."
              className="py-10"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-3">
          {meetingFollowUps.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(`/follow-ups?id=${item.id}`)}
              className="w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)] outline-none transition-transform hover:-translate-y-0.5 hover:bg-paper focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium break-words">{item.title}</p>
                <FollowUpBadge status={item.status} overdue={isOverdue(item.scheduledFor)} />
              </div>
              <p className="mt-2 min-w-0 text-xs break-words text-muted-foreground">
                {item.recipient} · {formatRelativeDay(item.scheduledFor)}
              </p>
            </button>
          ))}
          {!meetingFollowUps.length ? (
            <EmptyState
              icon={<CalendarCheckIcon className="size-4" />}
              title="No follow-ups scheduled"
              description="This transcript did not produce recap or owner check-ins."
              className="py-10"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="trace" className="mt-4">
          <AgentTrace steps={meeting.agentRun?.steps ?? []} />
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          {meeting.transcript.trim() ? (
            <div className="rounded-2xl border border-border/70 bg-paper p-4">
              <p className="kicker">Raw transcript</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Source text the agents read — not formatted minutes.
              </p>
              <pre className="mt-3 max-h-[32rem] overflow-auto font-mono text-xs leading-5 break-words whitespace-pre-wrap">
                {meeting.transcript}
              </pre>
            </div>
          ) : (
            <EmptyState
              title="No transcript stored"
              description="This meeting has no transcript text in the workspace. Minutes and provenance still stand from the saved run."
              className="py-10"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
