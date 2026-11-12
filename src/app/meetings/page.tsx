"use client";

import { EmptyState } from "@/components/empty-state";
import { MeetingStatusBadge } from "@/components/status-badges";
import { PageHeader } from "@/components/page-header";
import { TiltSurface } from "@/components/tilt-surface";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDay } from "@/lib/dates";
import { useWorkspace } from "@/lib/store";
import { NotebookPenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  return (
    <WorkspaceReady>
      <MeetingsBody />
    </WorkspaceReady>
  );
}

function MeetingsBody() {
  const { meetings, tasks, risks, followUps } = useWorkspace();

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        kicker="Archive"
        title="Meetings"
        description="One meeting becomes minutes, decisions, tasks, risks, and follow-ups."
        actions={
          <Button render={<Link href="/meetings/new" />}>
            <PlusIcon data-icon="inline-start" />
            Process meeting
          </Button>
        }
      />

      {meetings.length ? (
        <div className="grid gap-4">
          {meetings.map((meeting) => {
            const taskCount = tasks.filter((task) => task.meetingId === meeting.id).length;
            const riskCount = risks.filter(
              (item) => item.meetingId === meeting.id && item.status !== "resolved",
            ).length;
            const followCount = followUps.filter((item) => item.meetingId === meeting.id).length;
            return (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="min-w-0">
                <TiltSurface>
                  <Card className="folio overflow-hidden transition-shadow hover:shadow-[0_20px_48px_oklch(0.28_0.03_240/0.1)]">
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-heading text-lg leading-snug break-words">{meeting.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatRelativeDay(meeting.date)} · {meeting.attendees.length} attendees ·{" "}
                        {taskCount} tasks · {riskCount} risks · {followCount} follow-ups
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <MeetingStatusBadge status={meeting.status} />
                      <span className="text-xs text-muted-foreground">
                        {meeting.durationMinutes} min
                      </span>
                    </div>
                  </CardContent>
                </Card>
                </TiltSurface>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<NotebookPenIcon className="size-4" />}
          title="No meetings yet"
          description="Process your first meeting to generate minutes, tasks, risks and follow-ups."
          action={
            <Button render={<Link href="/meetings/new" />}>Process a transcript</Button>
          }
        />
      )}
    </div>
  );
}
