import type { FollowUp, Risk, Task, WorkspaceData } from "@/lib/types";
import { isUnassignedOwner } from "@/lib/owners";

function migrateTask(task: Task): Task {
  const unassigned = isUnassignedOwner(task.owner);
  return {
    ...task,
    owner: unassigned ? "" : task.owner,
    ownerResolution:
      task.ownerResolution ?? (unassigned ? "unassigned" : "resolved"),
    dueDateSource: task.dueDateSource ?? (task.dueDate ? "explicit" : "none"),
    prioritySource: task.prioritySource ?? "default",
  };
}

function migrateFollowUp(item: FollowUp): FollowUp {
  let kind = item.kind;
  if (!kind) {
    if (item.taskId) kind = "task-checkin";
    else if (/recap/i.test(item.title)) kind = "recap";
    else if (/open question/i.test(item.title)) kind = "open-questions";
  }
  return {
    ...item,
    kind,
    recipient: isUnassignedOwner(item.recipient) ? "Needs owner" : item.recipient,
  };
}

function deriveRisks(data: WorkspaceData, tasks: Task[]): Risk[] {
  if (data.risks?.length) {
    return data.risks.map((risk) => ({
      ...risk,
      status: risk.status ?? "open",
    }));
  }

  const risks: Risk[] = [];
  for (const meeting of data.meetings ?? []) {
    for (const raw of meeting.minutes?.risks ?? []) {
      const match = raw.match(/^([^:]{2,40}):\s*(.+)$/);
      const raisedBy = match?.[1];
      const description = match?.[2] ?? raw;
      const related = tasks.find(
        (task) =>
          task.meetingId === meeting.id &&
          task.sourceQuote &&
          description.includes(task.sourceQuote.slice(0, 32)),
      );
      risks.push({
        id: `rsk_migrated_${meeting.id}_${risks.length}`,
        meetingId: meeting.id,
        description,
        sourceQuote: description,
        raisedBy,
        relatedTaskId: related?.id,
        status: "open",
        createdAt: meeting.createdAt,
      });
    }
  }
  return risks;
}

export function normalizeWorkspace(data: WorkspaceData): WorkspaceData {
  const meetings = data.meetings ?? [];
  const tasks = (data.tasks ?? []).map(migrateTask);
  const followUps = (data.followUps ?? []).map(migrateFollowUp);
  const risks = deriveRisks(data, tasks);
  return { meetings, tasks, followUps, risks };
}
