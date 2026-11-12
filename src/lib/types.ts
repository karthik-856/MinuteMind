export type MeetingStatus = "draft" | "processing" | "ready" | "failed";
export type TaskStatus = "open" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type FollowUpStatus = "scheduled" | "sent" | "acknowledged" | "done";
export type FollowUpKind = "recap" | "task-checkin" | "open-questions";
export type RiskStatus = "open" | "monitoring" | "resolved";
export type OwnerResolution =
  | "speaker"
  | "named"
  | "addressed"
  | "attendee-mention"
  | "fallback-speaker"
  | "unassigned"
  | "manual"
  | "resolved";
export type DueDateSource = "explicit" | "none";
export type PrioritySource = "explicit" | "inferred-deadline" | "default";
export type AgentName =
  | "orchestrator"
  | "scribe"
  | "decision"
  | "action"
  | "risk"
  | "followup";
export type AgentStepStatus = "pending" | "running" | "done" | "failed";

export interface Attendee {
  name: string;
  role?: string;
}

export interface TranscriptTurn {
  index: number;
  timestamp?: string;
  speaker: string;
  role?: string;
  text: string;
}

export interface DiscussionPoint {
  topic: string;
  summary: string;
  speakers: string[];
}

export interface Decision {
  id: string;
  text: string;
  decidedBy?: string;
  rationale?: string;
  quote?: string;
}

export interface Minutes {
  executiveSummary: string;
  agenda: string[];
  discussion: DiscussionPoint[];
  decisions: Decision[];
  risks: string[];
  openQuestions: string[];
}

export interface Task {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  owner: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  sourceQuote?: string;
  ownerResolution?: OwnerResolution;
  dueDateSource?: DueDateSource;
  prioritySource?: PrioritySource;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  meetingId: string;
  taskId?: string;
  title: string;
  recipient: string;
  scheduledFor: string;
  status: FollowUpStatus;
  note: string;
  kind?: FollowUpKind;
  createdAt: string;
}

export interface Risk {
  id: string;
  meetingId: string;
  description: string;
  sourceQuote?: string;
  raisedBy?: string;
  relatedTaskId?: string;
  status: RiskStatus;
  createdAt: string;
}

export interface AgentStep {
  id: string;
  agent: AgentName;
  status: AgentStepStatus;
  title: string;
  summary: string;
  detail?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface AgentRun {
  id: string;
  meetingId: string;
  startedAt: string;
  finishedAt?: string;
  engine: "local" | "llm";
  steps: AgentStep[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  attendees: Attendee[];
  source: "paste" | "upload" | "sample" | "recording";
  transcript: string;
  status: MeetingStatus;
  minutes?: Minutes;
  agentRun?: AgentRun;
  createdAt: string;
}

export interface WorkspaceData {
  meetings: Meeting[];
  tasks: Task[];
  followUps: FollowUp[];
  risks: Risk[];
}

export interface ProcessInput {
  title: string;
  date: string;
  durationMinutes?: number;
  transcript: string;
  source?: Meeting["source"];
  meetingId?: string;
  createdAt?: string;
}

export interface ProcessResult {
  meeting: Meeting;
  tasks: Task[];
  followUps: FollowUp[];
  risks: Risk[];
}

export const AGENT_ORDER: AgentName[] = [
  "orchestrator",
  "scribe",
  "decision",
  "action",
  "risk",
  "followup",
];

export const AGENT_CATALOG: Record<
  AgentName,
  { label: string; role: string; handsOffTo: string; input: string; output: string }
> = {
  orchestrator: {
    label: "Orchestrator",
    role: "Parses the transcript, identifies speakers, and routes work to specialist agents.",
    handsOffTo: "Scribe",
    input: "Raw meeting transcript",
    output: "Speaker list, roles, and speaking turns",
  },
  scribe: {
    label: "Scribe",
    role: "Drafts the minutes: agenda, discussion points, and an executive summary.",
    handsOffTo: "Decision",
    input: "Parsed turns from the Orchestrator",
    output: "Structured minutes: summary, agenda, discussion",
  },
  decision: {
    label: "Decision",
    role: "Extracts commitments the group actually agreed on, with who signed off.",
    handsOffTo: "Action",
    input: "Minutes draft and transcript sentences",
    output: "Decisions with source quotes",
  },
  action: {
    label: "Action",
    role: "Turns spoken commitments into owned tasks with due dates and priority.",
    handsOffTo: "Risk",
    input: "Decisions and commitment language",
    output: "Tasks with owner, deadline, and source sentence",
  },
  risk: {
    label: "Risk",
    role: "Flags blockers, slippage, and unresolved questions that need attention.",
    handsOffTo: "Follow-up",
    input: "Transcript sentences about blockers and uncertainty",
    output: "Risks, open questions, and related meetings",
  },
  followup: {
    label: "Follow-up",
    role: "Schedules reminders before due dates and a recap for attendees.",
    handsOffTo: "Workspace",
    input: "Tasks, risks, and attendees",
    output: "Recap and owner check-ins, plus email/calendar drafts you send yourself",
  },
};
