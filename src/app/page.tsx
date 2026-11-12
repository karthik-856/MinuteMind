"use client";

import { EmptyState } from "@/components/empty-state";
import { Feather3D } from "@/components/feather-3d";
import { FeatherField } from "@/components/feather-field";
import { FlowRibbon } from "@/components/flow-ribbon";
import { FollowUpBadge, RiskStatusBadge } from "@/components/status-badges";
import { TiltSurface } from "@/components/tilt-surface";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAttentionItems, type AttentionItem } from "@/lib/attention";
import { formatRelativeDay, isOverdue } from "@/lib/dates";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { useWorkspace } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  AlertTriangleIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const KIND_DOT: Record<AttentionItem["kind"], string> = {
  "overdue-task": "bg-red-500",
  "open-risk": "bg-amber-500",
  unassigned: "bg-brass",
  "due-soon": "bg-sky-500",
  "follow-up-ack": "bg-primary",
};

export default function OverviewPage() {
  return (
    <WorkspaceReady>
      <OverviewBody />
    </WorkspaceReady>
  );
}

function OverviewBody() {
  const { meetings, tasks, followUps, risks } = useWorkspace();
  const openTasks = tasks.filter((task) => task.status !== "done");
  const overdueTasks = openTasks.filter((task) => task.dueDate && isOverdue(task.dueDate));
  const upcomingFollowUps = followUps.filter((item) => item.status !== "done");
  const openRisks = risks.filter((item) => item.status !== "resolved");
  const attention = buildAttentionItems(meetings, tasks, followUps, risks);
  const recent = [...meetings].slice(0, 4);
  const hero = usePointerTilt(8);

  return (
    <div className="min-w-0 space-y-8">
      <section
        className="desk-panel px-5 py-8 sm:px-9 sm:py-10"
        onPointerMove={hero.onPointerMove}
        onPointerLeave={hero.onPointerLeave}
      >
        <div className="paper-sheen" />
        <FeatherField density="hero" className="opacity-70" />
        <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-brass/15 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="space-y-7">
            <div className="min-w-0">
              <p className="kicker">Command center</p>
              <h1 className="font-heading mt-2 max-w-3xl text-[2.45rem] leading-[1.06] tracking-tight text-balance break-words sm:text-5xl lg:text-[3.25rem]">
                MinuteMind turns meetings into execution
              </h1>
              <div className="ink-rule w-24" />
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                One transcript becomes minutes, decisions, owned tasks, risks, and follow-ups —
                with a source sentence for every output.
              </p>
            </div>
            <FlowRibbon signature />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/meetings/new" />}>
                <PlusIcon data-icon="inline-start" />
                Process a transcript
              </Button>
              <p className="text-xs text-muted-foreground">
                Campus Nav is the recommended live demo
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute top-3 right-3 max-h-40 max-w-24 overflow-hidden opacity-35 lg:hidden">
            <div className="origin-top-right scale-[0.42]">
              <Feather3D rotateX={hero.tilt.x} rotateY={hero.tilt.y} floating={false} />
            </div>
          </div>
          <div className="mx-auto hidden max-w-[11rem] overflow-hidden lg:block">
            <Feather3D rotateX={hero.tilt.x} rotateY={hero.tilt.y} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open tasks"
          value={openTasks.length}
          hint={`${tasks.filter((task) => task.status === "done").length} completed`}
          href="/tasks"
          icon={<ClipboardListIcon className="size-4" />}
          tone="teal"
        />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks.length}
          hint="Past the spoken deadline"
          href="/tasks?filter=overdue"
          icon={<ClipboardListIcon className="size-4" />}
          tone="rose"
          warn={overdueTasks.length > 0}
        />
        <StatCard
          label="Upcoming follow-ups"
          value={upcomingFollowUps.length}
          hint="Still closing the loop"
          href="/follow-ups"
          icon={<CalendarCheckIcon className="size-4" />}
          tone="sky"
        />
        <StatCard
          label="Risks / blockers"
          value={openRisks.length}
          hint="Open or monitoring"
          href="/risks"
          icon={<AlertTriangleIcon className="size-4" />}
          tone="amber"
          warn={openRisks.length > 0}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="border-b border-primary/10 bg-paper/60">
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              Overdue work, unassigned commitments, open risks, and follow-ups waiting on a reply.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {attention.length ? (
              <ul className="divide-y">
                {attention.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={item.href}
                      className="flex min-w-0 items-start gap-3 rounded-md outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[item.kind])}
                      />
                      <span className="min-w-0">
                        <p className="text-sm font-medium break-words">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<AlertTriangleIcon className="size-4" />}
                title="Nothing needs attention"
                description="Open work is on track. Process another meeting when you have a new transcript."
                className="border-0 bg-transparent py-10"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-primary/10 bg-paper/60">
            <CardTitle>Recent meetings</CardTitle>
            <CardDescription>Open a meeting to walk transcript → minutes → work.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recent.length ? (
              <ul className="space-y-2">
                {recent.map((meeting) => (
                  <li key={meeting.id}>
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="block min-w-0 rounded-xl border border-transparent bg-muted/35 px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-paper hover:shadow-md"
                    >
                      <p className="font-heading text-[17px] leading-snug break-words">
                        {meeting.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatRelativeDay(meeting.date)} · {meeting.attendees.length} attendees ·{" "}
                        {meeting.minutes?.decisions.length ?? 0} decisions
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<ClipboardListIcon className="size-4" />}
                title="No meetings yet"
                description="Process your first meeting to generate minutes, tasks, risks and follow-ups."
                action={
                  <Button size="sm" render={<Link href="/meetings/new" />}>
                    Start with a sample
                  </Button>
                }
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-primary/10 bg-paper/60">
            <CardTitle>Follow-up queue</CardTitle>
            <CardDescription>Check-ins the Follow-up agent already scheduled.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingFollowUps.length ? (
              <ul className="space-y-3">
                {upcomingFollowUps
                  .slice()
                  .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.id}>
                      <Link href={`/follow-ups?id=${item.id}`} className="block rounded-lg p-1 -m-1 transition-colors hover:bg-paper hover:text-primary">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium break-words">{item.title}</p>
                            <p className="mt-1 min-w-0 text-xs break-words text-muted-foreground">
                              {item.recipient} · {formatRelativeDay(item.scheduledFor)}
                            </p>
                          </div>
                          <FollowUpBadge
                            status={item.status}
                            overdue={isOverdue(item.scheduledFor)}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarCheckIcon className="size-4" />}
                title="Inbox zero"
                description="No pending follow-ups. Process a meeting to schedule recaps and owner check-ins."
                className="border-0 bg-transparent py-10"
              />
            )}
            <Button variant="ghost" size="sm" className="mt-4" render={<Link href="/follow-ups" />}>
              Open follow-up inbox
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-primary/10 bg-paper/60">
            <CardTitle>Open risks</CardTitle>
            <CardDescription>Blockers the Risk agent flagged from the transcript.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {openRisks.length ? (
              <ul className="space-y-3">
                {[...openRisks]
                  .sort((a, b) => Number(a.status === "monitoring") - Number(b.status === "monitoring"))
                  .slice(0, 5)
                  .map((risk) => (
                  <li key={risk.id}>
                      <Link href={`/risks?id=${risk.id}`} className="block rounded-lg p-1 -m-1 min-w-0 transition-colors hover:bg-paper hover:text-primary">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm font-medium break-words">{risk.description}</p>
                        <RiskStatusBadge status={risk.status} />
                      </div>
                      {risk.raisedBy ? (
                        <p className="mt-1 text-xs text-muted-foreground">Raised by {risk.raisedBy}</p>
                      ) : null}
                      {risk.sourceQuote ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          “{risk.sourceQuote}”
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<AlertTriangleIcon className="size-4" />}
                title="No active risks"
                description="MinuteMind hasn't detected any unresolved blockers."
                className="border-0 bg-transparent py-10"
              />
            )}
            <Button variant="ghost" size="sm" className="mt-4" render={<Link href="/risks" />}>
              Open risks
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  warn,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  href: string;
  warn?: boolean;
  tone: "teal" | "rose" | "sky" | "amber";
}) {
  const tones = {
    teal: "bg-primary/15 text-primary",
    rose: "bg-red-100 text-red-800",
    sky: "bg-sky-100 text-sky-900",
    amber: "bg-amber-100 text-amber-950",
  };

  return (
    <TiltSurface>
      <Link
        href={href}
        className="block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Card
          className={cn(
            "h-full transition-shadow duration-200 hover:shadow-[0_18px_40px_oklch(0.28_0.03_240/0.12)]",
            warn && "ring-1 ring-red-200",
          )}
        >
          <CardContent className="flex min-h-[6.75rem] items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="kicker">{label}</p>
              <p className="mt-2 font-heading text-4xl tabular-nums">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
            <div className={cn("rounded-xl p-2.5", tones[tone])}>{icon}</div>
          </CardContent>
        </Card>
      </Link>
    </TiltSurface>
  );
}
