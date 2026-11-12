import { normalizeWorkspace } from "@/lib/normalize";
import type { WorkspaceData } from "@/lib/types";

export const BACKUP_KIND = "minutemind-workspace";
export const BACKUP_VERSION = 1;

export interface WorkspaceBackup {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: string;
  data: WorkspaceData;
}

export function buildWorkspaceBackup(data: WorkspaceData): WorkspaceBackup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: normalizeWorkspace(data),
  };
}

export function parseWorkspaceBackup(raw: string): WorkspaceData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  const bag = parsed as Partial<WorkspaceBackup> & Partial<WorkspaceData>;
  const data: WorkspaceData | undefined =
    bag.kind === BACKUP_KIND && bag.data
      ? bag.data
      : bag.meetings && bag.tasks
        ? {
            meetings: bag.meetings,
            tasks: bag.tasks,
            followUps: bag.followUps ?? [],
            risks: bag.risks ?? [],
          }
        : undefined;

  if (!data?.meetings) {
    throw new Error("That file is not a MinuteMind workspace backup.");
  }

  return normalizeWorkspace(data);
}

export function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
