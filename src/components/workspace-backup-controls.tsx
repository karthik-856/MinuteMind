"use client";

import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/store";
import {
  buildWorkspaceBackup,
  downloadTextFile,
  parseWorkspaceBackup,
} from "@/lib/workspace-backup";
import { toast } from "sonner";

export function WorkspaceBackupControls() {
  const { meetings, tasks, followUps, risks, replaceWorkspace } = useWorkspace();

  function exportBackup() {
    const backup = buildWorkspaceBackup({ meetings, tasks, followUps, risks });
    downloadTextFile(
      `minutemind-workspace-${backup.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
    toast.success("Workspace backup downloaded. Keep it off this browser.");
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    void file.text().then((raw) => {
      try {
        const next = parseWorkspaceBackup(raw);
        const ok = window.confirm(
          `Replace this browser workspace with “${file.name}”? ${next.meetings.length} meetings will load. Current data in this browser will be overwritten.`,
        );
        if (!ok) return;
        replaceWorkspace(next);
        toast.success("Workspace restored from backup.");
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "Could not import that file.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={exportBackup}>
        Export workspace
      </Button>
      <Button variant="outline" render={<label htmlFor="workspace-backup-file" className="cursor-pointer" />}>
        Import backup
        <input
          id="workspace-backup-file"
          name="workspace-backup-file"
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </Button>
    </div>
  );
}
