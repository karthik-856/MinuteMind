import { createId, inferOwner } from "@/lib/agents/pipeline";
import { parseTranscript } from "@/lib/agents/parse";
import { addDays, isoDate, parseIsoDate, resolveRelativeDate } from "@/lib/dates";
import type {
  Decision,
  FollowUp,
  Meeting,
  ProcessResult,
  Risk,
  Task,
} from "@/lib/types";

export interface GapProposal {
  kind: "decision" | "task" | "risk" | "question";
  text: string;
  quote: string;
  owner?: string;
}

export interface ValidatedGaps {
  decisions: Decision[];
  tasks: Task[];
  risks: Risk[];
  questions: string[];
  executiveSummary?: string;
}

export function normalizeQuote(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function quoteInTranscript(quote: string, transcript: string): boolean {
  const needle = normalizeQuote(quote);
  if (needle.length < 18) return false;
  return normalizeQuote(transcript).includes(needle);
}

export function validateGapProposals(
  proposals: GapProposal[],
  transcript: string,
  coveredQuotes: string[],
  meeting: Pick<Meeting, "id" | "date" | "attendees">,
  createdAt: string,
): ValidatedGaps {
  const parsed = parseTranscript(transcript);
  const covered = new Set(coveredQuotes.map(normalizeQuote).filter(Boolean));
  const meetingDate = parseIsoDate(meeting.date);
  const gaps: ValidatedGaps = {
    decisions: [],
    tasks: [],
    risks: [],
    questions: [],
  };

  for (const proposal of proposals) {
    const quote = proposal.quote?.trim() ?? "";
    if (!quoteInTranscript(quote, transcript)) continue;
    const key = normalizeQuote(quote);
    if (covered.has(key)) continue;
    covered.add(key);

    const text = proposal.text.replace(/\s+/g, " ").trim();
    if (text.length < 12) continue;

    if (proposal.kind === "decision") {
      gaps.decisions.push({
        id: createId("dec"),
        text: text.slice(0, 220),
        quote,
        decidedBy: proposal.owner && parsed.attendees.some((person) => person.name === proposal.owner)
          ? proposal.owner
          : undefined,
      });
      continue;
    }

    if (proposal.kind === "task") {
      const ownerInfo = inferOwner(quote, "Unknown", parsed.attendees);
      const named = proposal.owner
        ? parsed.attendees.find(
            (person) => person.name.toLowerCase() === proposal.owner?.toLowerCase(),
          )
        : undefined;
      const owner = named?.name ?? ownerInfo.owner;
      gaps.tasks.push({
        id: createId("tsk"),
        meetingId: meeting.id,
        title: text.slice(0, 110),
        description: quote.slice(0, 240),
        owner,
        dueDate: resolveRelativeDate(quote, meetingDate),
        priority: "medium",
        status: "open",
        sourceQuote: quote,
        ownerResolution: named ? "named" : ownerInfo.resolution,
        dueDateSource: resolveRelativeDate(quote, meetingDate) ? "explicit" : "none",
        prioritySource: "default",
        createdAt,
      });
      continue;
    }

    if (proposal.kind === "risk") {
      gaps.risks.push({
        id: createId("rsk"),
        meetingId: meeting.id,
        description: text.slice(0, 180),
        sourceQuote: quote,
        raisedBy: proposal.owner,
        status: "open",
        createdAt,
      });
      continue;
    }

    gaps.questions.push(`${text.slice(0, 180)}`);
  }

  return gaps;
}

export function applyValidatedGaps(
  current: ProcessResult,
  gaps: ValidatedGaps,
  createdAt: string,
): { result: ProcessResult; added: number } {
  const meeting = current.meeting;
  const minutes = meeting.minutes;
  const nextTasks = [...current.tasks, ...gaps.tasks];
  const nextRisks = [...current.risks, ...gaps.risks];
  const extraFollowUps: FollowUp[] = gaps.tasks.map((task) => ({
    id: createId("fu"),
    meetingId: meeting.id,
    taskId: task.id,
    title: `Check in on “${task.title.slice(0, 72)}”`,
    recipient: task.owner || "Needs owner",
    scheduledFor: isoDate(addDays(parseIsoDate(meeting.date), 2)),
    status: "scheduled",
    kind: "task-checkin",
    note: "Added after a quote-checked model pass on unmatched sentences.",
    createdAt,
  }));

  const added =
    gaps.decisions.length +
    gaps.tasks.length +
    gaps.risks.length +
    gaps.questions.length;

  return {
    added,
    result: {
      meeting: {
        ...meeting,
        minutes: minutes
          ? {
              ...minutes,
              executiveSummary: gaps.executiveSummary || minutes.executiveSummary,
              decisions: [...minutes.decisions, ...gaps.decisions],
              risks: [
                ...minutes.risks,
                ...gaps.risks.map((item) =>
                  item.raisedBy ? `${item.raisedBy}: ${item.description}` : item.description,
                ),
              ],
              openQuestions: [...minutes.openQuestions, ...gaps.questions],
            }
          : minutes,
        agentRun: meeting.agentRun
          ? {
              ...meeting.agentRun,
              engine: added > 0 || Boolean(gaps.executiveSummary) ? "llm" : meeting.agentRun.engine,
            }
          : meeting.agentRun,
      },
      tasks: nextTasks,
      risks: nextRisks,
      followUps: [...current.followUps, ...extraFollowUps],
    },
  };
}

export function coveredQuotesFrom(result: ProcessResult): string[] {
  const minutes = result.meeting.minutes;
  return [
    ...(minutes?.decisions.map((item) => item.quote ?? item.text) ?? []),
    ...result.tasks.map((task) => task.sourceQuote ?? task.title),
    ...result.risks.map((risk) => risk.sourceQuote ?? risk.description),
    ...(minutes?.openQuestions ?? []),
  ];
}
