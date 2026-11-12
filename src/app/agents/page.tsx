"use client";

import { AgentTrace } from "@/components/agent-trace";
import { Feather3D } from "@/components/feather-3d";
import { FlowRibbon } from "@/components/flow-ribbon";
import { PageHeader } from "@/components/page-header";
import { WorkspaceReady } from "@/components/workspace-ready";
import { WorkspaceBackupControls } from "@/components/workspace-backup-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_CATALOG, AGENT_ORDER, type AgentName } from "@/lib/types";
import { useWorkspace } from "@/lib/store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const FLOW = [
  "Meeting happens",
  "Minutes generated",
  "Decisions captured",
  "Commitments assigned",
  "Risks detected",
  "Follow-ups scheduled",
  "Nothing falls through the cracks",
];

export default function AgentsPage() {
  return (
    <WorkspaceReady>
      <AgentsBody />
    </WorkspaceReady>
  );
}

function AgentsBody() {
  const { resetWorkspace, meetings } = useWorkspace();
  const [selected, setSelected] = useState<AgentName>("orchestrator");
  const agent = AGENT_CATALOG[selected];
  const lastMeeting = [...meetings]
    .filter((meeting) => meeting.agentRun)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const lastRun = lastMeeting?.agentRun;
  const selectedStep = lastRun?.steps.find((step) => step.agent === selected);
  const runs = meetings.filter((meeting) => meeting.agentRun).length;
  const selectedIndex = AGENT_ORDER.indexOf(selected);
  const previousAgent = selectedIndex > 0 ? AGENT_CATALOG[AGENT_ORDER[selectedIndex - 1]] : null;

  const statusLabel = useMemo(() => {
    if (!lastRun) return "No saved run yet";
    if (selectedStep?.status === "done") return "Completed in last saved run";
    if (selectedStep?.status === "running") return "Running";
    return "Not in the last saved trace";
  }, [lastRun, selectedStep]);

  return (
    <div className="min-w-0 space-y-8">
      <section className="desk-panel px-5 py-7 sm:px-8 sm:py-9">
        <div className="paper-sheen" />
        <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-brass/15 blur-3xl" />
        <div className="pointer-events-none absolute top-6 right-4 hidden opacity-50 sm:block">
          <div className="origin-top-right scale-50">
            <Feather3D floating />
          </div>
        </div>
        <div className="relative space-y-6">
          <PageHeader
            kicker="Architecture"
            title="From conversation to execution"
            description="MinuteMind turns unstructured meeting conversations into structured, trackable work. A coordinator plus five specialists hand artifacts down the line — this is not a single summary."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button render={<Link href="/meetings/new" />}>Watch a live run</Button>
                <WorkspaceBackupControls />
                <Button
                  variant="outline"
                  onClick={() => {
                    const ok = window.confirm(
                      "Reset this browser workspace to the seeded demo meetings? Live pipeline runs will be removed.",
                    );
                    if (!ok) return;
                    void resetWorkspace().then(() => toast.success("Demo data restored."));
                  }}
                >
                  Reset demo data
                </Button>
              </div>
            }
          />
          <FlowRibbon signature />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/20 bg-paper px-3 py-1 text-xs font-medium text-primary">
          Local-first AI
        </span>
        <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground">
          Works without an API key
        </span>
        <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground">
          Optional audio transcription
        </span>
        <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground">
          Optional LLM refinement
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How work moves</CardTitle>
          <CardDescription>The product loop a judge should see in 20 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((step, index) => (
              <li key={step} className="rounded-xl border border-border/60 bg-paper px-3 py-3">
                <p className="kicker">
                  {index === FLOW.length - 1 ? "Outcome" : `Step ${index + 1}`}
                </p>
                <p className="mt-1.5 font-heading text-[15px] leading-snug">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div>
          <p className="mb-3 kicker">
            Recording or transcript → workspace
          </p>
          <ol className="pipeline-rail">
            <li className="rounded-lg border border-dashed border-border/80 bg-paper px-3 py-2 text-sm text-muted-foreground">
              Audio recording
              <span className="mt-0.5 block text-[11px] text-brass/90">Ingestion · optional</span>
            </li>
            <li className="rounded-lg border border-dashed border-border/80 bg-paper px-3 py-2 text-sm text-muted-foreground">
              Speech-to-text + speaker diarization
              <span className="mt-0.5 block text-[11px] text-brass/90">
                Not an agent · produces the transcript
              </span>
            </li>
            <li className="rounded-lg border border-dashed border-border/80 bg-paper px-3 py-2 text-sm text-muted-foreground">
              Transcript
            </li>
            {AGENT_ORDER.map((name, index) => {
              const step = lastRun?.steps.find((item) => item.agent === name);
              const nextName = AGENT_ORDER[index + 1];
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => setSelected(name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring",
                      selected === name
                        ? "border-primary bg-paper ring-1 ring-primary/20"
                        : "border-border/70 bg-card hover:border-primary/25 hover:bg-paper",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                          selected === name
                            ? "bg-primary text-primary-foreground"
                            : "bg-brass/15 text-brass",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium">{AGENT_CATALOG[name].label}</span>
                    </span>
                    {step?.status === "done" ? (
                      <span className="shrink-0 text-[10px] font-medium text-emerald-800">Done</span>
                    ) : null}
                  </button>
                  <p className="mt-1 pl-8 text-[11px] text-brass/90">
                    {nextName
                      ? `Hands off to ${AGENT_CATALOG[nextName].label}`
                      : "Hands off to workspace"}
                  </p>
                </li>
              );
            })}
            <li className="rounded-lg border border-dashed border-border/80 bg-paper px-3 py-2 text-sm text-muted-foreground">
              Workspace
            </li>
          </ol>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              {selectedIndex + 1}. {agent.label} agent
            </CardTitle>
            <CardDescription>
              {previousAgent
                ? `Receives structured output from ${previousAgent.label} · hands off to ${agent.handsOffTo}`
                : `Receives the raw transcript · hands off to ${agent.handsOffTo}`}
              {statusLabel ? ` · ${statusLabel}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            <p>{agent.role}</p>
            <dl className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="rounded-xl border border-border/60 bg-paper p-3">
                <dt className="kicker">
                  Input
                </dt>
                <dd className="mt-1">{agent.input}</dd>
              </div>
              <div className="hidden items-center justify-center text-brass sm:flex" aria-hidden>
                →
              </div>
              <div className="rounded-xl border border-primary/20 bg-white p-3">
                <dt className="kicker">
                  Output
                </dt>
                <dd className="mt-1">{agent.output}</dd>
              </div>
            </dl>
            {selectedStep?.summary ? (
              <div>
                <p className="kicker">
                  From the last saved trace
                </p>
                <p className="mt-1">{selectedStep.summary}</p>
                {selectedStep.detail ? (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted/70 p-2 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                    {selectedStep.detail}
                  </pre>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Process a meeting to store a real trace for this agent. This page does not fake a run.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {lastRun ? (
        <Card>
          <CardHeader>
            <CardTitle>Last saved agent trace</CardTitle>
            <CardDescription>
              Each specialist does one job — this is not a single LLM summary.
              {runs} meetings in this browser have a stored trace
              {lastMeeting ? ` · showing ${lastMeeting.title}` : ""}. Recorded local output, not a
              live model call.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgentTrace steps={lastRun.steps} compact />
          </CardContent>
        </Card>
      ) : null}

      <details className="rounded-2xl border border-border/70 bg-card p-4 text-sm shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)]">
        <summary className="cursor-pointer font-medium">Technical details</summary>
        <div className="mt-3 space-y-2 leading-6 text-muted-foreground">
          <p>
            The default engine is fully local. Optional audio upload uses OpenAI transcription
            with speaker diarization as an ingestion step before Agent 1. That is not a seventh
            agent. Optional gap-fill uses <code>gpt-4o-mini</code> only on unmatched sentences
            and keeps an item only if its quote appears in the transcript. Export a workspace
            JSON backup from this page so a cleared browser is not a total loss. Follow-ups
            open a mail or calendar draft — they are not sent automatically.
          </p>
          <p>
            Automatic minutes, task tracking, and follow-up management map to the Scribe, Action,
            and Follow-up agents respectively. Risks are first-class workspace items from the Risk
            agent.
          </p>
        </div>
      </details>
    </div>
  );
}
