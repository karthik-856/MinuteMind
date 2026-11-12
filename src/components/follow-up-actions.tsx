"use client";

import { Button } from "@/components/ui/button";
import { followUpIcs, followUpMessage, mailtoHref } from "@/lib/handoff";
import { downloadTextFile } from "@/lib/workspace-backup";
import { useWorkspace } from "@/lib/store";
import type { FollowUp } from "@/lib/types";
import { toast } from "sonner";

export function FollowUpActions({ item }: { item: FollowUp }) {
  const { meetings, tasks } = useWorkspace();
  const meeting = meetings.find((entry) => entry.id === item.meetingId);
  const task = tasks.find((entry) => entry.id === item.taskId);
  const meetingTasks = tasks.filter((entry) => entry.meetingId === item.meetingId);

  function copyDraft() {
    const { subject, body } = followUpMessage(item, meeting, task, meetingTasks);
    void navigator.clipboard.writeText(`${subject}\n\n${body}`).then(
      () => toast.success("Message copied. Paste it into email or WhatsApp."),
      () => toast.error("Could not copy the message."),
    );
  }

  function downloadCalendar() {
    downloadTextFile(
      `${item.id}.ics`,
      followUpIcs(item, meeting, task),
      "text/calendar",
    );
    toast.success("Calendar file downloaded. Import it in Google Calendar or Outlook.");
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="outline" render={<a href={mailtoHref(item, meeting, task, meetingTasks)} />}>
        Email draft
      </Button>
      <Button size="sm" variant="outline" onClick={copyDraft}>
        Copy message
      </Button>
      <Button size="sm" variant="outline" onClick={downloadCalendar}>
        Calendar .ics
      </Button>
    </div>
  );
}
