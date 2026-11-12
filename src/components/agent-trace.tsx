import { AGENT_CATALOG, type AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon } from "lucide-react";

export function AgentTrace({
  steps,
  compact = false,
}: {
  steps: AgentStep[];
  compact?: boolean;
}) {
  if (!steps.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Run a transcript to see the six specialist agents hand work to each other.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const meta = AGENT_CATALOG[step.agent];
        return (
          <li key={step.id}>
            <div
              className={cn(
                "rounded-xl border border-border/70 bg-card p-3 shadow-[0_8px_24px_oklch(0.28_0.03_240/0.05)] transition-colors duration-200",
                step.status === "running" && "border-primary/40 ring-2 ring-primary/15",
                step.status === "done" && "border-border/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    step.status === "running" && "bg-primary text-primary-foreground",
                    step.status === "done" && "bg-emerald-700 text-white",
                    step.status === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {step.status === "running" ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : step.status === "done" ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      <span className="mr-1.5 text-[11px] text-brass">{index + 1}.</span>
                      {meta.label} agent
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hands off to {meta.handsOffTo}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.summary}</p>
                  {!compact && step.detail ? (
                    <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-muted/70 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {step.detail}
                    </pre>
                  ) : null}
                </div>
              </div>
            </div>
            {index < steps.length - 1 ? (
              <p className="py-1.5 pl-10 text-[11px] text-brass/80">↓ {meta.handsOffTo}</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
