import type { Task } from "@/lib/types";

export function isUnassignedOwner(owner?: string): boolean {
  if (!owner) return true;
  const value = owner.trim().toLowerCase();
  return value === "unknown" || value === "unassigned" || value === "needs owner";
}

export function displayOwner(owner?: string): string {
  return isUnassignedOwner(owner) ? "Unassigned" : owner!.trim();
}

export function isUnassignedTask(task: Task): boolean {
  return isUnassignedOwner(task.owner) || task.ownerResolution === "unassigned";
}
