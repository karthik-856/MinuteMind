import { displayOwner, isUnassignedTask } from "@/lib/owners";
import type { FollowUp, Task } from "@/lib/types";

export function ownerExplanation(task: Task): string {
  switch (task.ownerResolution) {
    case "speaker":
      return `${displayOwner(task.owner)} committed in the first person (“I’ll” / “I will”).`;
    case "named":
      return `The sentence named ${displayOwner(task.owner)} as the person who will do the work.`;
    case "addressed":
      return `The speaker addressed ${displayOwner(task.owner)} directly (“please…”, “can you…”).`;
    case "attendee-mention":
      return `${displayOwner(task.owner)} was mentioned in the commitment and matched an attendee.`;
    case "fallback-speaker":
      return `No other owner was named, so the speaker (${displayOwner(task.owner)}) was used.`;
    case "unassigned":
      return "The transcript did not identify an owner. Assign someone in the workspace.";
    case "manual":
      return `${displayOwner(task.owner)} was assigned in the workspace after processing.`;
    case "resolved":
      return `${displayOwner(task.owner)} was resolved from the spoken commitment when this meeting was processed.`;
    default:
      return isUnassignedTask(task)
        ? "The transcript did not identify an owner."
        : `${displayOwner(task.owner)} was taken from the spoken commitment.`;
  }
}

export function deadlineExplanation(task: Task): string {
  if (task.dueDateSource === "none" || !task.dueDate) {
    return "No deadline phrase was spoken. The Follow-up agent still queued a check-in.";
  }
  return `A date phrase in the sentence was resolved to ${task.dueDate}.`;
}

export function priorityExplanation(task: Task): string {
  switch (task.prioritySource) {
    case "explicit":
      return "Priority language was spoken (urgent, important, this week, and similar).";
    case "inferred-deadline":
      return "Priority was raised because the detected deadline is close to the meeting date.";
    case "default":
      return "No priority was stated, so it defaulted to medium.";
    default:
      return "Priority comes from the Action agent’s reading of the commitment.";
  }
}

export function followUpWhy(item: FollowUp, task?: Task): string {
  if (item.kind === "recap") {
    return "A recap is scheduled so attendees receive the minutes after the meeting.";
  }
  if (item.kind === "open-questions") {
    return "The Risk agent found unresolved questions. This follow-up closes that loop.";
  }
  if (task) {
    return `Check progress on “${task.title}” before the deadline.`;
  }
  return item.note || "Scheduled from the meeting so the commitment is not lost.";
}

export function riskWhy(): string {
  return "This sentence matched blocker or risk language in the transcript (for example “blocker”, “might slip”, or “waiting on”).";
}
