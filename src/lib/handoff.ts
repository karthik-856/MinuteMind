import { minutesToMarkdown } from "@/lib/agents/pipeline";
import { formatLongDate } from "@/lib/dates";
import type { FollowUp, Meeting, Task } from "@/lib/types";

export function followUpMessage(
  item: FollowUp,
  meeting?: Meeting,
  task?: Task,
  tasks: Task[] = [],
): { subject: string; body: string } {
  const subject = item.title;
  const lines = [
    item.note,
    "",
    meeting ? `Meeting: ${meeting.title} (${formatLongDate(meeting.date)})` : "",
    task ? `Task: ${task.title}` : "",
    task?.owner ? `Owner: ${task.owner}` : item.recipient ? `To: ${item.recipient}` : "",
    task?.dueDate ? `Due: ${task.dueDate}` : `Scheduled: ${item.scheduledFor}`,
    task?.sourceQuote ? `Said in the room: “${task.sourceQuote}”` : "",
  ].filter(Boolean);

  if (item.kind === "recap" && meeting) {
    lines.push("", minutesToMarkdown(meeting, tasks.filter((entry) => entry.meetingId === meeting.id)));
  }

  return { subject, body: lines.join("\n") };
}

export function mailtoHref(item: FollowUp, meeting?: Meeting, task?: Task, tasks: Task[] = []): string {
  const { subject, body } = followUpMessage(item, meeting, task, tasks);
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
}

export function followUpIcs(item: FollowUp, meeting?: Meeting, task?: Task): string {
  const stamp = item.scheduledFor.replaceAll("-", "");
  const end = nextDay(item.scheduledFor).replaceAll("-", "");
  const description = escapeIcs(
    [item.note, meeting ? `Meeting: ${meeting.title}` : "", task ? `Task: ${task.title}` : ""]
      .filter(Boolean)
      .join("\\n"),
  );
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MinuteMind//Follow-up//EN",
    "BEGIN:VEVENT",
    `UID:${item.id}@minutemind.local`,
    `DTSTAMP:${stamp}T090000Z`,
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(item.title)}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function nextDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, (day ?? 1) + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}
