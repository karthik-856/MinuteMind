"use client";

import { ProvenanceStack, ProvenanceStep } from "@/components/provenance-stack";
import { SourceQuote } from "@/components/source-quote";
import { RiskStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { riskWhy } from "@/lib/provenance";
import { useWorkspace } from "@/lib/store";
import type { Risk } from "@/lib/types";
import Link from "next/link";

export function RiskDetailSheet({
  risk,
  open,
  onOpenChange,
}: {
  risk: Risk | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { meetings, tasks, updateRiskStatus } = useWorkspace();
  const meeting = meetings.find((item) => item.id === risk?.meetingId);
  const relatedTask = tasks.find((item) => item.id === risk?.relatedTaskId);

  if (!risk) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full min-w-0 gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-primary/10 bg-paper">
          <p className="kicker">Risk / blocker</p>
          <SheetTitle className="pr-8 text-left text-balance">{risk.description}</SheetTitle>
          <SheetDescription className="text-left">
            <RiskStatusBadge status={risk.status} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <section className="rounded-2xl border border-brass/20 bg-paper/80 p-4">
            <h3 className="kicker">Why was this created?</h3>
            <p className="mt-2 text-sm leading-6">{riskWhy()}</p>
            <h3 className="kicker mt-5">Source commitment</h3>
            <SourceQuote quote={risk.sourceQuote} className="mt-3" emphasized />
          </section>

          <ProvenanceStack>
            <ProvenanceStep label="Raised by">
              {risk.raisedBy ?? "Speaker was not labelled in the transcript."}
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
            <ProvenanceStep label="Related task">
              {relatedTask ? (
                <Link href={`/tasks?id=${relatedTask.id}`} className="text-primary hover:underline">
                  {relatedTask.title}
                </Link>
              ) : (
                "No linked action item — this blocker stood on its own in the transcript."
              )}
            </ProvenanceStep>
          </ProvenanceStack>

          <div className="flex flex-wrap gap-2">
            {risk.status !== "monitoring" && risk.status !== "resolved" ? (
              <Button variant="outline" onClick={() => updateRiskStatus(risk.id, "monitoring")}>
                Monitor
              </Button>
            ) : null}
            {risk.status !== "resolved" ? (
              <Button onClick={() => updateRiskStatus(risk.id, "resolved")}>Resolve</Button>
            ) : (
              <Button variant="outline" onClick={() => updateRiskStatus(risk.id, "open")}>
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
