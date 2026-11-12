"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  applyValidatedGaps,
  coveredQuotesFrom,
  validateGapProposals,
  type GapProposal,
} from "@/lib/agents/gaps";
import { runPipeline } from "@/lib/agents/pipeline";
import { normalizeWorkspace } from "@/lib/normalize";
import { buildSeed } from "@/lib/seed";
import type {
  AgentStep,
  FollowUp,
  FollowUpStatus,
  Meeting,
  ProcessInput,
  ProcessResult,
  Risk,
  RiskStatus,
  Task,
  TaskStatus,
  WorkspaceData,
} from "@/lib/types";

const STORAGE_KEY = "minutemind-workspace-v1";

interface WorkspaceContextValue {
  ready: boolean;
  meetings: Meeting[];
  tasks: Task[];
  followUps: FollowUp[];
  risks: Risk[];
  processMeeting: (
    input: ProcessInput,
    onProgress?: (step: AgentStep, partial: ProcessResult) => void,
    options?: { fillGaps?: boolean },
  ) => Promise<ProcessResult>;
  fillGaps: (meetingId: string) => Promise<{ added: number }>;
  replaceWorkspace: (next: WorkspaceData) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskOwner: (taskId: string, owner: string) => void;
  updateFollowUpStatus: (followUpId: string, status: FollowUpStatus) => void;
  updateRiskStatus: (riskId: string, status: RiskStatus) => void;
  deleteMeeting: (meetingId: string) => void;
  resetWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<WorkspaceData>({
    meetings: [],
    tasks: [],
    followUps: [],
    risks: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WorkspaceData;
          if (!cancelled && parsed.meetings?.length) {
            setData(normalizeWorkspace(parsed));
            setReady(true);
            return;
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      const seed = await buildSeed();
      if (!cancelled) {
        const next = normalizeWorkspace(seed);
        setData(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      meetings: data.meetings,
      tasks: data.tasks,
      followUps: data.followUps,
      risks: data.risks,
      async processMeeting(input, onProgress, options) {
        let result = await runPipeline(input, onProgress, { delayMs: 520 });
        if (options?.fillGaps) {
          result = (await requestAndApplyGaps(result)).result;
        }
        writeMeetingResult(setData, result);
        return result;
      },
      async fillGaps(meetingId) {
        const meeting = data.meetings.find((item) => item.id === meetingId);
        if (!meeting) throw new Error("Meeting not found in this workspace.");
        const current: ProcessResult = {
          meeting,
          tasks: data.tasks.filter((item) => item.meetingId === meetingId),
          followUps: data.followUps.filter((item) => item.meetingId === meetingId),
          risks: data.risks.filter((item) => item.meetingId === meetingId),
        };
        const { result: next, added } = await requestAndApplyGaps(current);
        writeMeetingResult(setData, next);
        return { added };
      },
      replaceWorkspace(next) {
        setData(normalizeWorkspace(next));
      },
      updateTaskStatus(taskId, status) {
        setData((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId ? { ...task, status } : task,
          ),
        }));
      },
      updateTaskOwner(taskId, owner) {
        const trimmed = owner.trim();
        setData((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  owner: trimmed,
                  ownerResolution: trimmed ? "manual" : "unassigned",
                }
              : task,
          ),
          followUps: current.followUps.map((item) =>
            item.taskId === taskId
              ? { ...item, recipient: trimmed || "Needs owner" }
              : item,
          ),
        }));
      },
      updateFollowUpStatus(followUpId, status) {
        setData((current) => ({
          ...current,
          followUps: current.followUps.map((item) =>
            item.id === followUpId ? { ...item, status } : item,
          ),
        }));
      },
      updateRiskStatus(riskId, status) {
        setData((current) => ({
          ...current,
          risks: current.risks.map((item) =>
            item.id === riskId ? { ...item, status } : item,
          ),
        }));
      },
      deleteMeeting(meetingId) {
        setData((current) => ({
          meetings: current.meetings.filter((item) => item.id !== meetingId),
          tasks: current.tasks.filter((item) => item.meetingId !== meetingId),
          followUps: current.followUps.filter((item) => item.meetingId !== meetingId),
          risks: current.risks.filter((item) => item.meetingId !== meetingId),
        }));
      },
      async resetWorkspace() {
        window.localStorage.removeItem(STORAGE_KEY);
        const seed = normalizeWorkspace(await buildSeed());
        setData(seed);
      },
    }),
    [data, ready],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}

function writeMeetingResult(
  setData: Dispatch<SetStateAction<WorkspaceData>>,
  result: ProcessResult,
) {
  setData((current) => ({
    meetings: [
      result.meeting,
      ...current.meetings.filter((item) => item.id !== result.meeting.id),
    ],
    tasks: [
      ...result.tasks,
      ...current.tasks.filter((item) => item.meetingId !== result.meeting.id),
    ],
    followUps: [
      ...result.followUps,
      ...current.followUps.filter((item) => item.meetingId !== result.meeting.id),
    ],
    risks: [
      ...result.risks,
      ...current.risks.filter((item) => item.meetingId !== result.meeting.id),
    ],
  }));
}

async function requestAndApplyGaps(
  result: ProcessResult,
): Promise<{ result: ProcessResult; added: number }> {
  const transcript = result.meeting.transcript;
  const response = await fetch("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      coveredQuotes: coveredQuotesFrom(result),
      refineSummary: true,
      existingSummary: result.meeting.minutes?.executiveSummary,
    }),
  });
  const payload = (await response.json()) as {
    error?: string;
    proposals?: GapProposal[];
    executiveSummary?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Gap fill failed.");
  }
  const createdAt = new Date().toISOString();
  const gaps = validateGapProposals(
    payload.proposals ?? [],
    transcript,
    coveredQuotesFrom(result),
    result.meeting,
    createdAt,
  );
  gaps.executiveSummary = payload.executiveSummary;
  return applyValidatedGaps(result, gaps, createdAt);
}
