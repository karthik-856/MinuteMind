import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspaceBackup, parseWorkspaceBackup } from "./workspace-backup";

test("round-trips a workspace backup", () => {
  const data = {
    meetings: [
      {
        id: "mtg_1",
        title: "Review",
        date: "2026-09-03",
        durationMinutes: 30,
        attendees: [{ name: "Tara Menon" }],
        source: "paste" as const,
        transcript: "Tara Menon: Hello.",
        status: "ready" as const,
        createdAt: "2026-09-03T10:00:00.000Z",
      },
    ],
    tasks: [],
    followUps: [],
    risks: [],
  };
  const raw = JSON.stringify(buildWorkspaceBackup(data));
  const restored = parseWorkspaceBackup(raw);
  assert.equal(restored.meetings[0]?.title, "Review");
});

test("rejects unrelated JSON", () => {
  assert.throws(() => parseWorkspaceBackup('{"hello":true}'), /not a MinuteMind/);
});
