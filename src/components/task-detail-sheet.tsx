"use client";

import { ExtractedLabel } from "@/components/extracted-label";
import { OwnerLabel } from "@/components/owner-label";
import { ProvenanceStack, ProvenanceStep } from "@/components/provenance-stack";
import { SourceQuote } from "@/components/source-quote";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRelativeDay } from "@/lib/dates";
import { displayOwner, isUnassignedTask } from "@/lib/owners";
import {
  deadlineExplanation,
  ownerExplanation,
  priorityExplanation,
} from "@/lib/provenance";
import { useWorkspace } from "@/lib/store";
import type { Task } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: {
  task: Task | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { meetings, followUps, updateTaskOwner, updateTaskStatus } = useWorkspace();
  const meeting = meetings.find((item) => item.id === task?.meetingId);
  const linked = followUps.filter((item) => item.taskId === task?.id);
  const attendees = useMemo(
    () =>
      [...new Set(meetings.flatMap((item) => item.attendees.map((person) => person.name)))],
    [meetings],
  );
  const [ownerDraft, setOwnerDraft] = useState({ taskId: "", value: "" });
  const draftValue = ownerDraft.taskId === task?.id ? ownerDraft.value : "";

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full min-w-0 gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-primary/10 bg-paper">
          <p className="kicker">Task</p>
          <SheetTitle className="pr-8 text-left text-balance">{task.title}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2 text-left">
            <ExtractedLabel />
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <section className="rounded-2xl border border-brass/20 bg-paper/80 p-4">
            <h3 className="kicker">Why was this created?</h3>
            <p className="mt-2 text-sm leading-6">
              The Action agent extracted this from a spoken commitment. MinuteMind did not invent
              the work — it linked it back to the transcript.
            </p>
            <h3 className="kicker mt-5">Source commitment</h3>
            <SourceQuote quote={task.sourceQuote ?? task.description} emphasized className="mt-3" />
          </section>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-paper p-3">
              <dt className="kicker">Owner</dt>
              <dd className="mt-1.5">
                <OwnerLabel owner={task.owner} />
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-paper p-3">
              <dt className="kicker">Deadline</dt>
              <dd className="mt-1.5 text-sm">
                {task.dueDate ? formatRelativeDay(task.dueDate) : "No date spoken"}
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-paper p-3">
              <dt className="kicker">Priority</dt>
              <dd className="mt-1.5">
                <PriorityBadge priority={task.priority} />
              </dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-paper p-3">
              <dt className="kicker">Source meeting</dt>
              <dd className="mt-1.5 text-sm break-words">
                {meeting ? (
                  <Link href={`/meetings/${meeting.id}`} className="text-primary hover:underline">
                    {meeting.title}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          <ProvenanceStack>
            <ProvenanceStep label="Owner detected from">
              <OwnerLabel owner={task.owner} />
              <p className="mt-1 text-muted-foreground">{ownerExplanation(task)}</p>
            </ProvenanceStep>
            <ProvenanceStep label="Deadline detected from">
              {task.dueDate ? formatRelativeDay(task.dueDate) : "No date spoken"}
              <p className="mt-1 text-muted-foreground">{deadlineExplanation(task)}</p>
            </ProvenanceStep>
            <ProvenanceStep label="Priority determined from">
              <PriorityBadge priority={task.priority} />
              <p className="mt-1 text-muted-foreground">{priorityExplanation(task)}</p>
            </ProvenanceStep>
            <ProvenanceStep label="Source meeting">
              {meeting ? (
                <Link href={`/meetings/${meeting.id}`} className="text-primary hover:underline">
                  {meeting.title}
                </Link>
              ) : (
                "—"
              )}
            </ProvenanceStep>
          </ProvenanceStack>

          {linked.length ? (
            <section>
              <h3 className="kicker">Follow-ups</h3>
              <ul className="mt-2 space-y-1">
                {linked.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/follow-ups?id=${item.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-2 rounded-xl border bg-paper p-3">
            <Label htmlFor="assign-owner">
              {isUnassignedTask(task) ? "Assign an owner" : "Reassign owner"}
            </Label>
            <div className="flex min-w-0 gap-2">
              <Input
                id="assign-owner"
                name="assign-owner"
                list="attendee-options"
                placeholder="Name from the room…"
                value={draftValue}
                onChange={(event) =>
                  setOwnerDraft({ taskId: task.id, value: event.target.value })
                }
              />
              <datalist id="attendee-options">
                {attendees.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <Button
                onClick={() => {
                  updateTaskOwner(task.id, draftValue);
                  setOwnerDraft({ taskId: task.id, value: "" });
                }}
                disabled={!draftValue.trim()}
              >
                Save
              </Button>
            </div>
            {!isUnassignedTask(task) ? (
              <p className="text-xs text-muted-foreground">
                Currently {displayOwner(task.owner)}.
              </p>
            ) : null}
          </section>

          <div className="flex flex-wrap gap-2">
            {task.status !== "in_progress" && task.status !== "done" ? (
              <Button variant="outline" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                Start
              </Button>
            ) : null}
            {task.status !== "done" ? (
              <Button onClick={() => updateTaskStatus(task.id, "done")}>Mark done</Button>
            ) : (
              <Button variant="outline" onClick={() => updateTaskStatus(task.id, "open")}>
                Reopen
              </Button>
            )}
            {meeting ? (
              <Button variant="ghost" render={<Link href={`/meetings/${meeting.id}?tab=transcript`} />}>
                View source
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
