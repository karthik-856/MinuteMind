"use client";

import { FollowUpActions } from "@/components/follow-up-actions";
import { OwnerLabel } from "@/components/owner-label";
import { ProvenanceStack, ProvenanceStep } from "@/components/provenance-stack";
import { SourceQuote } from "@/components/source-quote";
import { FollowUpBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRelativeDay, isOverdue } from "@/lib/dates";
import { followUpKindLabel } from "@/lib/format";
import { followUpWhy } from "@/lib/provenance";
import { useWorkspace } from "@/lib/store";
import type { FollowUp } from "@/lib/types";
import Link from "next/link";

export function FollowUpDetailSheet({
  item,
  open,
  onOpenChange,
}: {
  item: FollowUp | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { meetings, tasks, updateFollowUpStatus } = useWorkspace();
  const meeting = meetings.find((entry) => entry.id === item?.meetingId);
  const task = tasks.find((entry) => entry.id === item?.taskId);

  if (!item) return null;

  const overdue = isOverdue(item.scheduledFor) && item.status !== "done";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full min-w-0 gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-primary/10 bg-paper">
          <p className="kicker">{followUpKindLabel(item.kind)}</p>
          <SheetTitle className="pr-8 text-left text-balance">{item.title}</SheetTitle>
          <SheetDescription className="text-left">
            <FollowUpBadge status={item.status} overdue={overdue} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <section>
            <h3 className="kicker">Why was this created?</h3>
            <p className="mt-2 text-sm leading-6">{followUpWhy(item, task)}</p>
          </section>

          {task?.sourceQuote ? (
            <section>
              <h3 className="kicker">Source commitment</h3>
              <SourceQuote quote={task.sourceQuote} className="mt-3" emphasized />
            </section>
          ) : null}

          <ProvenanceStack>
            <ProvenanceStep label="Source meeting">
              {meeting ? (
                <Link href={`/meetings/${meeting.id}`} className="text-primary hover:underline">
                  {meeting.title}
                </Link>
              ) : (
                "—"
              )}
            </ProvenanceStep>
            {task ? (
              <ProvenanceStep label="Commitment / task">
                <Link href={`/tasks?id=${task.id}`} className="text-primary hover:underline">
                  {task.title}
                </Link>
              </ProvenanceStep>
            ) : (
              <ProvenanceStep label="Commitment / task">
                Minutes recap for everyone in the room — not tied to a single task.
              </ProvenanceStep>
            )}
            <ProvenanceStep label="Who owns this follow-up">
              <OwnerLabel owner={item.recipient} />
            </ProvenanceStep>
            <ProvenanceStep label="When it is due">
              {formatRelativeDay(item.scheduledFor)}
              {task?.dueDate ? (
                <p className="mt-1 text-muted-foreground">
                  Task deadline: {formatRelativeDay(task.dueDate)}
                </p>
              ) : null}
            </ProvenanceStep>
          </ProvenanceStack>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Drafts open in your mail or calendar app. Mark sent only after you actually send them.
            </p>
            <FollowUpActions item={item} />
          </div>

          <div className="flex flex-wrap gap-2">
            {item.status !== "sent" && item.status !== "done" ? (
              <Button variant="outline" onClick={() => updateFollowUpStatus(item.id, "sent")}>
                Mark sent
              </Button>
            ) : null}
            {item.status === "sent" ? (
              <Button
                variant="outline"
                onClick={() => updateFollowUpStatus(item.id, "acknowledged")}
              >
                Acknowledged
              </Button>
            ) : null}
            {item.status !== "done" ? (
              <Button onClick={() => updateFollowUpStatus(item.id, "done")}>Done</Button>
            ) : (
              <Button variant="outline" onClick={() => updateFollowUpStatus(item.id, "scheduled")}>
                Reopen
              </Button>
            )}
            {task ? (
              <Button variant="ghost" render={<Link href={`/tasks?id=${task.id}`} />}>
                Open task
              </Button>
            ) : null}
            {meeting ? (
              <Button variant="ghost" render={<Link href={`/meetings/${meeting.id}`} />}>
                View source
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
