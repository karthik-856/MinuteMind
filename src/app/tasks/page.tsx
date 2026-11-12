"use client";

import { EmptyState } from "@/components/empty-state";
import { ExtractedLabel } from "@/components/extracted-label";
import { OwnerLabel } from "@/components/owner-label";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badges";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeDay, isOverdue } from "@/lib/dates";
import { taskStatusLabel } from "@/lib/format";
import { isUnassignedTask } from "@/lib/owners";
import { useWorkspace } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ClipboardListIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const COLUMNS: { status: TaskStatus; hint: string }[] = [
  { status: "open", hint: "Not started" },
  { status: "in_progress", hint: "Someone is on it" },
  { status: "blocked", hint: "Waiting on a dependency" },
  { status: "done", hint: "Closed" },
];

export default function TasksPage() {
  return (
    <WorkspaceReady>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
        <TasksBody />
      </Suspense>
    </WorkspaceReady>
  );
}

function TasksBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, meetings, updateTaskStatus } = useWorkspace();
  const selectedId = searchParams.get("id");
  const filter = searchParams.get("filter");
  const [owner, setOwner] = useState("all");

  const owners = useMemo(
    () => ["all", "unassigned", ...new Set(tasks.map((task) => task.owner).filter(Boolean))],
    [tasks],
  );

  const visible = tasks.filter((task) => {
    if (filter === "overdue" && !(task.dueDate && isOverdue(task.dueDate) && task.status !== "done")) {
      return false;
    }
    if (owner === "unassigned") return isUnassignedTask(task);
    if (owner !== "all" && task.owner !== owner) return false;
    return true;
  });

  const selected = tasks.find((task) => task.id === selectedId);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        kicker="Commitments"
        title="Task tracking"
        description="Action items extracted from spoken commitments. Open a card to see the source sentence and how owner, deadline, and priority were resolved."
      />

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="owner-filter" className="text-sm">
          <span className="mr-2 text-muted-foreground">Owner</span>
          <select
            id="owner-filter"
            name="owner-filter"
            className="h-8 max-w-full rounded-lg border bg-paper px-2 text-sm"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          >
            {owners.map((name) => (
              <option key={name} value={name}>
                {name === "all" ? "Everyone" : name === "unassigned" ? "Unassigned" : name}
              </option>
            ))}
          </select>
        </label>
        {filter === "overdue" ? (
          <Button size="sm" variant="outline" onClick={() => router.push("/tasks")}>
            Clear overdue filter
          </Button>
        ) : null}
      </div>

      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const items = visible.filter((task) => task.status === column.status);
            return (
              <section
                key={column.status}
                className="min-w-0 rounded-2xl border border-border/70 bg-paper/90 p-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.65)]"
              >
                <div className="mb-3 flex items-baseline justify-between px-1">
                  <h2 className="font-heading text-[17px] leading-none">
                    {taskStatusLabel(column.status)}
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      meetingTitle={
                        meetings.find((meeting) => meeting.id === task.meetingId)?.title
                      }
                      onStatus={updateTaskStatus}
                      onOpen={() => router.push(`/tasks?id=${task.id}`)}
                    />
                  ))}
                  {!items.length ? (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                      {column.hint}
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardListIcon className="size-4" />}
          title="No tasks in this view"
          description="Process a meeting with spoken commitments, or clear the owner filter."
        />
      )}

      <TaskDetailSheet
        task={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("id");
            const query = next.toString();
            router.push(query ? `/tasks?${query}` : "/tasks");
          }
        }}
      />
    </div>
  );
}

function TaskCard({
  task,
  meetingTitle,
  onStatus,
  onOpen,
}: {
  task: Task;
  meetingTitle?: string;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onOpen: () => void;
}) {
  const overdue = Boolean(task.dueDate && isOverdue(task.dueDate) && task.status !== "done");

  return (
    <article
      className={cn(
        "min-w-0 rounded-xl border border-border/70 bg-card p-3.5 shadow-[0_8px_22px_oklch(0.28_0.03_240/0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_oklch(0.28_0.03_240/0.1)]",
        overdue && "border-l-[3px] border-l-red-500",
        task.status === "done" && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-md text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="text-sm font-medium leading-6 break-words">{task.title}</p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Change status"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            {COLUMNS.map((column) => (
              <DropdownMenuItem
                key={column.status}
                onClick={() => onStatus(task.id, column.status)}
              >
                {taskStatusLabel(column.status)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <OwnerLabel owner={task.owner} />
        <ExtractedLabel />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} />
        {task.dueDate ? (
          <span className={overdue ? "text-xs text-red-700" : "text-xs text-muted-foreground"}>
            {formatRelativeDay(task.dueDate)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No deadline spoken</span>
        )}
      </div>
      {task.sourceQuote ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          “{task.sourceQuote}”
        </p>
      ) : null}
      {meetingTitle ? (
        <Link
          href={`/meetings/${task.meetingId}`}
          className="mt-2 block truncate text-xs text-primary hover:underline"
        >
          {meetingTitle}
        </Link>
      ) : null}
    </article>
  );
}
