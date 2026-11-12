import type {
  FollowUpStatus,
  MeetingStatus,
  RiskStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

export function taskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "blocked":
      return "Blocked";
  }
}

export function priorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
  }
}

export function followUpKindLabel(kind?: string): string {
  switch (kind) {
    case "recap":
      return "Minutes recap";
    case "task-checkin":
      return "Commitment check-in";
    case "open-questions":
      return "Open questions";
    default:
      return "Follow-up";
  }
}

export function followUpStatusLabel(status: FollowUpStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "sent":
      return "Sent";
    case "acknowledged":
      return "Acknowledged";
    case "done":
      return "Done";
  }
}

export function meetingStatusLabel(status: MeetingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "processing":
      return "Processing";
    case "ready":
      return "Minutes ready";
    case "failed":
      return "Failed";
  }
}

export function riskStatusLabel(status: RiskStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "monitoring":
      return "Monitoring";
    case "resolved":
      return "Resolved";
  }
}
