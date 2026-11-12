import {
  addDays,
  isoDate,
  parseIsoDate,
  resolveRelativeDate,
} from "@/lib/dates";
import {
  findAttendee,
  firstName,
  parseTranscript,
  sentenceSplit,
  type ParsedTranscript,
} from "@/lib/agents/parse";
import type {
  AgentName,
  AgentRun,
  AgentStep,
  Decision,
  DiscussionPoint,
  FollowUp,
  Meeting,
  Minutes,
  OwnerResolution,
  PrioritySource,
  ProcessInput,
  ProcessResult,
  Risk,
  Task,
  TaskPriority,
} from "@/lib/types";

const TOPIC_MARKERS =
  /\b(next|moving on|let'?s (talk|discuss|cover|look at)|agenda item|on the topic of|regarding|switching to|now for)\b/i;

const DECISION_MARKERS =
  /\b(we (decided|agreed|will go with|approved|chose|settled on)|decision:|let'?s (go with|do|use|ship)|approved|signed off|locking in|locked in|going with|final (call|decision))\b/i;

const ACTION_MARKERS =
  /\b(i('ll| will| can| am going to)|we('ll| will| need to)|please |can you |could you |need you to|will (take|send|draft|finish|update|share|schedule|prepare|review)|action( item)?:|assign(ed)? to|owner:|take the lead)\b/i;

export const EXTRACTION_CAPS = {
  agenda: 16,
  decisions: 40,
  tasks: 80,
  risks: 40,
  questions: 40,
} as const;

const RISK_MARKERS =
  /\b(blocker|blocked|risk|concern|worried|might slip|delay|dependency|at risk|slipping|not sure we can|waiting on)\b/i;

const QUESTION_MARKERS =
  /\b(do we know|what about|open question|still unclear|need clarity|can we confirm)\b|\?$/i;

export async function runPipeline(
  input: ProcessInput,
  onProgress?: (step: AgentStep, partial: ProcessResult) => void,
  options?: { delayMs?: number },
): Promise<ProcessResult> {
  const delayMs = options?.delayMs ?? 0;
  const meetingId = input.meetingId ?? createId("mtg");
  const createdAt = new Date().toISOString();
  const meetingDate = parseIsoDate(input.date);
  const parsed = parseTranscript(input.transcript);

  const meeting: Meeting = {
    id: meetingId,
    title: input.title.trim() || inferTitle(parsed) || "Untitled meeting",
    date: isoDate(meetingDate),
    durationMinutes:
      input.durationMinutes || estimateDuration(parsed.turns.length),
    attendees: parsed.attendees,
    source: input.source ?? "paste",
    transcript: input.transcript,
    status: "processing",
    createdAt: input.createdAt ?? createdAt,
  };

  const run: AgentRun = {
    id: createId("run"),
    meetingId,
    startedAt: createdAt,
    engine: "local",
    steps: [],
  };

  const result: ProcessResult = {
    meeting: { ...meeting, agentRun: run },
    tasks: [],
    followUps: [],
    risks: [],
  };

  const emit = async (
    agent: AgentName,
    title: string,
    summary: string,
    detail?: string,
  ) => {
    const step: AgentStep = {
      id: createId("step"),
      agent,
      status: "running",
      title,
      summary,
      detail,
      startedAt: new Date().toISOString(),
    };
    run.steps = [...run.steps, step];
    result.meeting = { ...result.meeting, agentRun: { ...run, steps: run.steps } };
    onProgress?.(step, { ...result });
    if (delayMs) await sleep(delayMs);
    step.status = "done";
    step.finishedAt = new Date().toISOString();
    onProgress?.(step, { ...result });
  };

  await emit(
    "orchestrator",
    "Parsed speakers and routed the transcript",
    `${parsed.attendees.length} attendees, ${parsed.turns.length} speaking turns.`,
    parsed.attendees
      .map((person) => (person.role ? `${person.name} (${person.role})` : person.name))
      .join(", "),
  );

  const minutesDraft = buildMinutes(parsed, meeting.title);
  await emit(
    "scribe",
    "Drafted structured minutes",
    `${minutesDraft.discussion.length} discussion points, ${minutesDraft.agenda.length} agenda items.`,
    minutesDraft.executiveSummary,
  );

  const decisions = extractDecisions(parsed);
  minutesDraft.decisions = decisions;
  await emit(
    "decision",
    "Captured group decisions",
    decisions.length
      ? `${decisions.length} decisions locked in.`
      : "No explicit decisions found — flagged for follow-up.",
    decisions.map((item) => item.text).join("\n") || undefined,
  );

  const tasks = extractTasks(parsed, meetingId, meetingDate, createdAt);
  result.tasks = tasks;
  await emit(
    "action",
    "Created owned action items",
    `${tasks.length} tasks with owners${countWithDue(tasks) ? ` and ${countWithDue(tasks)} due dates` : ""}.`,
    tasks.map((task) => `${task.owner || "Unassigned"}: ${task.title}`).join("\n") || undefined,
  );

  const risks = extractRisks(parsed, meetingId, createdAt, tasks);
  const questions = extractQuestions(parsed);
  minutesDraft.risks = risks.map((item) =>
    item.raisedBy ? `${item.raisedBy}: ${item.description}` : item.description,
  );
  minutesDraft.openQuestions = questions;
  result.risks = risks;
  result.meeting = {
    ...result.meeting,
    minutes: minutesDraft,
    status: "ready",
  };
  await emit(
    "risk",
    "Flagged blockers and open questions",
    `${risks.length} risks, ${questions.length} open questions.`,
    [...risks.map((item) => item.description), ...questions].join("\n") ||
      "No material risks detected.",
  );

  const followUps = buildFollowUps(
    meeting,
    tasks,
    questions,
    meetingDate,
    createdAt,
  );
  result.followUps = followUps;
  run.finishedAt = new Date().toISOString();
  result.meeting = {
    ...result.meeting,
    agentRun: { ...run, finishedAt: run.finishedAt, steps: run.steps },
  };
  await emit(
    "followup",
    "Scheduled reminders and a recap",
    `${followUps.length} follow-ups queued for owners and attendees.`,
    followUps.map((item) => `${item.scheduledFor} · ${item.title}`).join("\n"),
  );

  return result;
}

function buildMinutes(parsed: ParsedTranscript, title: string): Minutes {
  const clusters = clusterTopics(parsed);
  const discussion: DiscussionPoint[] = clusters.map((cluster) => ({
    topic: cluster.topic,
    summary: summarizeTurns(cluster.turns),
    speakers: unique(cluster.turns.map((turn) => turn.speaker)),
  }));

  const agenda = discussion.map((item) => item.topic).slice(0, EXTRACTION_CAPS.agenda);
  const highlights = discussion
    .slice(0, 3)
    .map((item) => item.summary)
    .filter(Boolean);

  const attendees = parsed.attendees.map((person) => firstName(person.name));
  const executiveSummary =
    highlights.length > 0
      ? `${title} brought together ${joinNames(attendees)}. ${highlights.join(" ")}`
      : `${title} was recorded with ${parsed.attendees.length} participants. Minutes were generated from the transcript.`;

  return {
    executiveSummary: clip(executiveSummary, 420),
    agenda: agenda.length ? agenda : ["General discussion"],
    discussion,
    decisions: [],
    risks: [],
    openQuestions: [],
  };
}

function clusterTopics(parsed: ParsedTranscript): {
  topic: string;
  turns: ParsedTranscript["turns"];
}[] {
  const clusters: { topic: string; turns: ParsedTranscript["turns"] }[] = [];
  let current: ParsedTranscript["turns"] = [];

  const flush = () => {
    if (!current.length) return;
    clusters.push({
      topic: inferTopic(current, clusters.length),
      turns: current,
    });
    current = [];
  };

  for (const turn of parsed.turns) {
    if (current.length > 2 && TOPIC_MARKERS.test(turn.text)) {
      flush();
    }
    current.push(turn);
    if (current.length >= 8) flush();
  }
  flush();

  return clusters.length ? clusters : [{ topic: "Discussion", turns: parsed.turns }];
}

function inferTopic(
  turns: ParsedTranscript["turns"],
  index: number,
): string {
  const blob = turns.map((turn) => turn.text).join(" ");
  const about = blob.match(
    /\b(?:about|regarding|around|on(?:\s+the\s+topic\s+of)?)\s+(?!monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next\b)([a-z0-9][a-z0-9 &'/-]{3,40})/i,
  );
  if (about) return titleCase(trimTopic(about[1]));

  const nouns = blob.match(
    /\b(demo|budget|timeline|testing|recruitment|ethics|parser|follow-up|minutes|placement|sprint|review|kickoff|architecture|evaluation|dataset|consent|internship)\b/i,
  );
  if (nouns) return titleCase(`${nouns[1]} discussion`);

  const first = sentenceSplit(turns[0]?.text ?? "")[0];
  if (first) return clip(first.replace(/[.?!]$/, ""), 48);
  return `Discussion ${index + 1}`;
}

function summarizeTurns(turns: ParsedTranscript["turns"]): string {
  const speakers = unique(turns.map((turn) => firstName(turn.speaker)));
  const sentences = turns.flatMap((turn) => sentenceSplit(turn.text));
  const picked =
    sentences.find((sentence) => sentence.length > 40 && sentence.length < 180) ??
    sentences[0] ??
    turns[0]?.text ??
    "";
  return clip(
    `${joinNames(speakers)} covered this. ${picked.replace(/^(I|We)\b/, (match) => match)}`,
    280,
  );
}

function extractDecisions(parsed: ParsedTranscript): Decision[] {
  const decisions: Decision[] = [];
  for (const turn of parsed.turns) {
    const sentences = sentenceSplit(turn.text);
    for (const sentence of sentences) {
      if (!DECISION_MARKERS.test(sentence)) continue;
      decisions.push({
        id: createId("dec"),
        text: clip(cleanCommitment(sentence), 220),
        decidedBy: turn.speaker,
        quote: sentence,
      });
    }
  }
  return dedupeBy(decisions, (item) => item.text.toLowerCase()).slice(
    0,
    EXTRACTION_CAPS.decisions,
  );
}

function extractTasks(
  parsed: ParsedTranscript,
  meetingId: string,
  meetingDate: Date,
  createdAt: string,
): Task[] {
  const tasks: Task[] = [];

  for (const turn of parsed.turns) {
    const sentences = sentenceSplit(turn.text);
    for (const sentence of sentences) {
      if (!ACTION_MARKERS.test(sentence) && !/\bby (monday|tuesday|wednesday|thursday|friday|next week)\b/i.test(sentence)) {
        continue;
      }
      if (DECISION_MARKERS.test(sentence) && !ACTION_MARKERS.test(sentence)) {
        continue;
      }

      const ownerInfo = inferOwner(sentence, turn.speaker, parsed.attendees);
      const dueDate = resolveRelativeDate(sentence, meetingDate);
      const priorityInfo = inferPriority(sentence, dueDate, meetingDate);
      const title = clip(toTaskTitle(sentence, ownerInfo.owner), 110);
      if (title.length < 12) continue;

      tasks.push({
        id: createId("tsk"),
        meetingId,
        title,
        description: clip(sentence, 240),
        owner: ownerInfo.owner,
        dueDate,
        priority: priorityInfo.priority,
        status: "open",
        sourceQuote: sentence,
        ownerResolution: ownerInfo.resolution,
        dueDateSource: dueDate ? "explicit" : "none",
        prioritySource: priorityInfo.source,
        createdAt,
      });
    }
  }

  return dedupeBy(tasks, (task) => `${task.owner}:${task.title.toLowerCase()}`).slice(
    0,
    EXTRACTION_CAPS.tasks,
  );
}

function extractRisks(
  parsed: ParsedTranscript,
  meetingId: string,
  createdAt: string,
  tasks: Task[],
): Risk[] {
  const risks: Risk[] = [];
  for (const turn of parsed.turns) {
    for (const sentence of sentenceSplit(turn.text)) {
      if (!RISK_MARKERS.test(sentence)) continue;
      const related = tasks.find(
        (task) =>
          task.sourceQuote &&
          (sentence.includes(task.sourceQuote.slice(0, 40)) ||
            task.sourceQuote.includes(sentence.slice(0, 40))),
      );
      risks.push({
        id: createId("rsk"),
        meetingId,
        description: clip(sentence, 180),
        sourceQuote: sentence,
        raisedBy: turn.speaker === "Unknown" ? undefined : turn.speaker,
        relatedTaskId: related?.id,
        status: "open",
        createdAt,
      });
    }
  }
  return dedupeBy(risks, (item) => item.description.toLowerCase()).slice(
    0,
    EXTRACTION_CAPS.risks,
  );
}

function extractQuestions(parsed: ParsedTranscript): string[] {
  const questions: string[] = [];
  for (const turn of parsed.turns) {
    for (const sentence of sentenceSplit(turn.text)) {
      if (QUESTION_MARKERS.test(sentence)) {
        questions.push(`${firstName(turn.speaker)}: ${clip(sentence, 180)}`);
      }
    }
  }
  return unique(questions).slice(0, EXTRACTION_CAPS.questions);
}

function buildFollowUps(
  meeting: Meeting,
  tasks: Task[],
  questions: string[],
  meetingDate: Date,
  createdAt: string,
): FollowUp[] {
  const items: FollowUp[] = [];
  const recapDate = isoDate(addDays(meetingDate, 1));

  items.push({
    id: createId("fu"),
    meetingId: meeting.id,
    title: `Send minutes recap · ${meeting.title}`,
    recipient: meeting.attendees.map((person) => person.name).join(", ") || "Attendees",
    scheduledFor: recapDate,
    status: "scheduled",
    kind: "recap",
    note: "Share the generated minutes, decisions, and action list with everyone who was in the room.",
    createdAt,
  });

  for (const task of tasks) {
    const due = task.dueDate ? parseIsoDate(task.dueDate) : addDays(meetingDate, 3);
    const reminder = addDays(due, due.getTime() <= meetingDate.getTime() ? 0 : -1);
    const scheduledFor = isoDate(
      reminder.getTime() < meetingDate.getTime() ? due : reminder,
    );
    items.push({
      id: createId("fu"),
      meetingId: meeting.id,
      taskId: task.id,
      title: `Check in on “${clip(task.title, 72)}”`,
      recipient: task.owner || "Needs owner",
      scheduledFor,
      status: "scheduled",
      kind: "task-checkin",
      note: task.dueDate
        ? `Due ${task.dueDate}. Confirm progress before the deadline.`
        : "No explicit deadline was spoken — confirm a date with the owner.",
      createdAt,
    });
  }

  if (questions.length) {
    items.push({
      id: createId("fu"),
      meetingId: meeting.id,
      title: "Resolve open questions from the meeting",
      recipient: meeting.attendees[0]?.name ?? "Facilitator",
      scheduledFor: isoDate(addDays(meetingDate, 2)),
      status: "scheduled",
      kind: "open-questions",
      note: questions.join(" "),
      createdAt,
    });
  }

  return items;
}

export function inferOwner(
  sentence: string,
  speaker: string,
  attendees: ParsedTranscript["attendees"],
): { owner: string; resolution: OwnerResolution } {
  if (/\b(i'll|i will|i can|i am going to|let me)\b/i.test(sentence) && speaker !== "Unknown") {
    return { owner: speaker, resolution: "speaker" };
  }

  const named = sentence.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)(?:'s)?\s+(?:will|can|to|should|please)\b/,
  );
  if (named) {
    const match = findAttendee(named[1], attendees);
    if (match) return { owner: match.name, resolution: "named" };
  }

  const addressed = sentence.match(
    /\b(?:please |can you |could you )?([A-Z][a-z]{2,})[,:]?\s+(?:please |can you |take|send|draft|finish|update)/i,
  );
  if (addressed) {
    const match = findAttendee(addressed[1], attendees);
    if (match) return { owner: match.name, resolution: "addressed" };
  }

  for (const person of attendees) {
    const first = firstName(person.name);
    if (new RegExp(`\\b${first}\\b`, "i").test(sentence) && person.name !== speaker) {
      return { owner: person.name, resolution: "attendee-mention" };
    }
  }

  if (speaker === "Unknown") {
    return { owner: "", resolution: "unassigned" };
  }

  return { owner: speaker, resolution: "fallback-speaker" };
}

function inferPriority(
  sentence: string,
  dueDate: string | undefined,
  meetingDate: Date,
): { priority: TaskPriority; source: PrioritySource } {
  const lower = sentence.toLowerCase();
  if (/\b(asap|urgent|today|blocker|critical|immediately)\b/.test(lower)) {
    return { priority: "urgent", source: "explicit" };
  }
  if (/\b(high priority|important|this week|must)\b/.test(lower)) {
    return { priority: "high", source: "explicit" };
  }
  if (/\b(nice to have|whenever|low priority|later)\b/.test(lower)) {
    return { priority: "low", source: "explicit" };
  }
  if (dueDate) {
    const due = parseIsoDate(dueDate).getTime();
    const delta = (due - meetingDate.getTime()) / 86_400_000;
    if (delta <= 1) return { priority: "urgent", source: "inferred-deadline" };
    if (delta <= 3) return { priority: "high", source: "inferred-deadline" };
  }
  return { priority: "medium", source: "default" };
}

function toTaskTitle(sentence: string, owner: string): string {
  let text = sentence
    .replace(/^(okay|ok|sure|yeah|yes|alright)[,.\s]+/i, "")
    .replace(/\b(i'll|i will|i can|i am going to)\b/i, "");
  if (owner) {
    text = text.replace(new RegExp(`\\b${firstName(owner)}\\b`, "ig"), "");
  }
  text = text
    .replace(/\b(will|please|can you|could you|need to|going to)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\s-]+/, "")
    .replace(/^to\s+/i, "")
    .replace(/^[,;:\s-]+/, "")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/[,.;:?!]+$/, "")
    .trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cleanCommitment(sentence: string): string {
  return sentence.replace(/^(okay|so|alright)[,.\s]+/i, "").trim();
}

function inferTitle(parsed: ParsedTranscript): string | undefined {
  const first = parsed.turns[0]?.text ?? "";
  const match = first.match(
    /\b(?:welcome to|this is|today(?:'s)?|kicking off)\s+(.{8,60}?)(?:[.!?]|$)/i,
  );
  if (match) return titleCase(trimTopic(match[1]));
  return undefined;
}

function estimateDuration(turns: number): number {
  return Math.max(20, Math.min(90, Math.round(turns * 1.4)));
}

function countWithDue(tasks: Task[]): number {
  return tasks.filter((task) => task.dueDate).length;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "the group";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function trimTopic(value: string): string {
  return value.replace(/[.,;:]+$/, "").replace(/\s+/g, " ").trim();
}

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = key(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function minutesToMarkdown(meeting: Meeting, tasks: Task[]): string {
  const minutes = meeting.minutes;
  const lines = [
    `# Minutes of Meeting`,
    ``,
    `**${meeting.title}**`,
    ``,
    `- Date: ${meeting.date}`,
    `- Duration: ${meeting.durationMinutes} minutes`,
    `- Attendees: ${meeting.attendees.map((person) => (person.role ? `${person.name} (${person.role})` : person.name)).join("; ") || "—"}`,
    ``,
    `## 1. Executive summary`,
    minutes?.executiveSummary ?? "Minutes were not generated.",
    ``,
    `## 2. Agenda`,
    ...(minutes?.agenda.map((item, index) => `${index + 1}. ${item}`) ?? ["—"]),
    ``,
    `## 3. Discussion`,
    ...(minutes?.discussion.flatMap((item) => [
      `### ${item.topic}`,
      item.summary,
      `Speakers: ${item.speakers.join(", ")}`,
      ``,
    ]) ?? ["—"]),
    `## 4. Decisions`,
    ...(minutes?.decisions.length
      ? minutes.decisions.map((item) => `- ${item.text}${item.decidedBy ? ` — ${item.decidedBy}` : ""}`)
      : ["- None recorded."]),
    ``,
    `## 5. Action items`,
    ...(tasks.length
      ? tasks.map(
          (task) =>
            `- [${task.status === "done" ? "x" : " "}] ${task.title} — ${task.owner || "Unassigned"}${task.dueDate ? ` (due ${task.dueDate})` : ""}`,
        )
      : ["- None recorded."]),
    ``,
    `## 6. Risks and open questions`,
    ...(minutes?.risks.length ? minutes.risks.map((item) => `- Risk: ${item}`) : ["- No risks flagged."]),
    ...(minutes?.openQuestions.map((item) => `- Question: ${item}`) ?? []),
  ];
  return lines.join("\n");
}
