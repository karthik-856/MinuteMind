import { Badge } from "@/components/ui/badge";
import {
  followUpStatusLabel,
  meetingStatusLabel,
  priorityLabel,
  riskStatusLabel,
  taskStatusLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  FollowUpStatus,
  MeetingStatus,
  RiskStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === "done" && "bg-emerald-100 text-emerald-900",
        status === "in_progress" && "bg-sky-100 text-sky-900",
        status === "blocked" && "bg-amber-100 text-amber-950",
        status === "open" && "bg-stone-100 text-stone-700",
      )}
    >
      {taskStatusLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md",
        priority === "urgent" && "border-red-300 bg-red-50 text-red-800",
        priority === "high" && "border-orange-300 bg-orange-50 text-orange-900",
        priority === "medium" && "border-stone-300 text-stone-700",
        priority === "low" && "border-stone-200 text-stone-500",
      )}
    >
      {priorityLabel(priority)}
    </Badge>
  );
}

export function FollowUpBadge({
  status,
  overdue,
}: {
  status: FollowUpStatus;
  overdue?: boolean;
}) {
  if (overdue && status !== "done") {
    return <Badge className="bg-red-100 text-red-900">Overdue</Badge>;
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === "done" && "bg-emerald-100 text-emerald-900",
        status === "sent" && "bg-sky-100 text-sky-900",
        status === "acknowledged" && "bg-teal-100 text-teal-900",
        status === "scheduled" && "bg-stone-100 text-stone-700",
      )}
    >
      {followUpStatusLabel(status)}
    </Badge>
  );
}

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <Badge variant={status === "ready" ? "default" : "secondary"}>
      {meetingStatusLabel(status)}
    </Badge>
  );
}

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === "resolved" && "bg-emerald-100 text-emerald-900",
        status === "monitoring" && "bg-amber-100 text-amber-950",
        status === "open" && "bg-red-50 text-red-800",
      )}
    >
      {riskStatusLabel(status)}
    </Badge>
  );
}

export function UnassignedBadge() {
  return (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-950">
      Needs owner
    </Badge>
  );
}
