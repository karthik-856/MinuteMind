import { isDueSoon, isOverdue } from "@/lib/dates";
import { isUnassignedTask } from "@/lib/owners";
import type { FollowUp, Meeting, Risk, Task } from "@/lib/types";

export interface AttentionItem {
  id: string;
  href: string;
  title: string;
  meta: string;
  kind: "overdue-task" | "due-soon" | "unassigned" | "open-risk" | "follow-up-ack";
}

export function buildAttentionItems(
  meetings: Meeting[],
  tasks: Task[],
  followUps: FollowUp[],
  risks: Risk[],
): AttentionItem[] {
  const meetingTitle = (id: string) =>
    meetings.find((meeting) => meeting.id === id)?.title ?? "Meeting";

  const items: AttentionItem[] = [];

  for (const task of tasks) {
    if (task.status === "done") continue;
    if (task.dueDate && isOverdue(task.dueDate)) {
      items.push({
        id: `overdue-${task.id}`,
        href: `/tasks?id=${task.id}`,
        title: task.title,
        meta: `${meetingTitle(task.meetingId)} · overdue`,
        kind: "overdue-task",
      });
    } else if (task.dueDate && isDueSoon(task.dueDate)) {
      items.push({
        id: `soon-${task.id}`,
        href: `/tasks?id=${task.id}`,
        title: task.title,
        meta: `${meetingTitle(task.meetingId)} · due soon`,
        kind: "due-soon",
      });
    }
    if (isUnassignedTask(task)) {
      items.push({
        id: `owner-${task.id}`,
        href: `/tasks?id=${task.id}`,
        title: task.title,
        meta: `${meetingTitle(task.meetingId)} · needs owner`,
        kind: "unassigned",
      });
    }
  }

  for (const risk of risks) {
    if (risk.status === "resolved") continue;
    items.push({
      id: `risk-${risk.id}`,
      href: `/risks?id=${risk.id}`,
      title: risk.description,
      meta: `${meetingTitle(risk.meetingId)} · ${risk.status === "monitoring" ? "monitoring" : "open risk"}`,
      kind: "open-risk",
    });
  }

  for (const followUp of followUps) {
    if (followUp.status === "sent") {
      items.push({
        id: `ack-${followUp.id}`,
        href: `/follow-ups?id=${followUp.id}`,
        title: followUp.title,
        meta: `${meetingTitle(followUp.meetingId)} · awaiting acknowledgement`,
        kind: "follow-up-ack",
      });
    }
  }

  const rank: Record<AttentionItem["kind"], number> = {
    "overdue-task": 0,
    "open-risk": 1,
    unassigned: 2,
    "due-soon": 3,
    "follow-up-ack": 4,
  };

  return items
    .sort((a, b) => rank[a.kind] - rank[b.kind])
    .slice(0, 8);
}
