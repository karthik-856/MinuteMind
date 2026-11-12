import { runPipeline } from "@/lib/agents/pipeline";
import { addDays, isoDate } from "@/lib/dates";
import { SAMPLE_MEETINGS } from "@/lib/samples";
import type { FollowUp, Risk, Task, WorkspaceData } from "@/lib/types";

export async function buildSeed(now = new Date()): Promise<WorkspaceData> {
  const meetings = [];
  const tasks: Task[] = [];
  const followUps: FollowUp[] = [];
  const risks: Risk[] = [];

  const processed = SAMPLE_MEETINGS.filter((sample) => sample.id !== "sample-sprint");

  for (const sample of processed) {
    const date = isoDate(addDays(now, -sample.daysAgo));
    const result = await runPipeline(
      {
        title: sample.title,
        date,
        durationMinutes: sample.durationMinutes,
        transcript: sample.transcript,
        source: "sample",
        meetingId: sample.id,
      },
      undefined,
      { delayMs: 0 },
    );

    result.meeting.createdAt = addDays(now, -sample.daysAgo).toISOString();
    applyDemoProgress(sample.id, result.tasks, result.followUps, result.risks);
    meetings.push(result.meeting);
    tasks.push(...result.tasks);
    followUps.push(...result.followUps);
    risks.push(...result.risks);
  }

  return { meetings, tasks, followUps, risks };
}

function applyDemoProgress(
  sampleId: string,
  tasks: Task[],
  followUps: FollowUp[],
  risks: Risk[],
) {
  if (sampleId === "sample-ethics") {
    tasks.forEach((task, index) => {
      if (index === 0) task.status = "done";
      if (index === 1) task.status = "in_progress";
    });
    followUps.forEach((item, index) => {
      if (index === 0) item.status = "done";
      if (index === 1) item.status = "sent";
    });
    if (risks[0]) risks[0].status = "monitoring";
  }

  if (sampleId === "sample-placement") {
    if (tasks[0]) tasks[0].status = "done";
    if (tasks[1]) tasks[1].status = "in_progress";
  }

  if (sampleId === "sample-fyp") {
    if (tasks[0]) tasks[0].status = "in_progress";
  }
}
