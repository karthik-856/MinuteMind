import assert from "node:assert/strict";
import test from "node:test";
import {
  applyValidatedGaps,
  quoteInTranscript,
  validateGapProposals,
} from "./gaps";
import type { ProcessResult } from "../types";

const transcript = `Tara Menon (PM): We should warn users the map is approximate.
Dev Patel (Engineering): Indoor ranging still misses the west wing.`;

test("gap fill drops proposals whose quote is not in the transcript", () => {
  const gaps = validateGapProposals(
    [
      {
        kind: "task",
        text: "Invent a mobile app rewrite",
        quote: "This sentence was never spoken in the meeting.",
      },
      {
        kind: "risk",
        text: "Map accuracy",
        quote: "We should warn users the map is approximate.",
      },
    ],
    transcript,
    [],
    { id: "mtg_test", date: "2026-09-03", attendees: [{ name: "Tara Menon" }] },
    "2026-09-03T10:00:00.000Z",
  );
  assert.equal(gaps.tasks.length, 0);
  assert.equal(gaps.risks.length, 1);
  assert.match(gaps.risks[0]?.sourceQuote ?? "", /approximate/);
});

test("already-covered quotes are not added twice", () => {
  const quote = "We should warn users the map is approximate.";
  const gaps = validateGapProposals(
    [{ kind: "risk", text: "Accuracy", quote }],
    transcript,
    [quote],
    { id: "mtg_test", date: "2026-09-03", attendees: [] },
    "2026-09-03T10:00:00.000Z",
  );
  assert.equal(gaps.risks.length, 0);
});

test("applyValidatedGaps appends check-ins only for new tasks", () => {
  const current: ProcessResult = {
    meeting: {
      id: "mtg_test",
      title: "Test",
      date: "2026-09-03",
      durationMinutes: 30,
      attendees: [],
      source: "paste",
      transcript,
      status: "ready",
      createdAt: "2026-09-03T10:00:00.000Z",
      minutes: {
        executiveSummary: "Summary",
        agenda: ["Map"],
        discussion: [],
        decisions: [],
        risks: [],
        openQuestions: [],
      },
    },
    tasks: [],
    followUps: [],
    risks: [],
  };
  const gaps = validateGapProposals(
    [
      {
        kind: "task",
        text: "Warn users the map is approximate",
        quote: "We should warn users the map is approximate.",
      },
    ],
    transcript,
    [],
    current.meeting,
    "2026-09-03T10:00:00.000Z",
  );
  const { result, added } = applyValidatedGaps(current, gaps, "2026-09-03T10:00:00.000Z");
  assert.equal(added, 1);
  assert.equal(result.tasks.length, 1);
  assert.equal(result.followUps.length, 1);
  assert.equal(quoteInTranscript(result.tasks[0]?.sourceQuote ?? "", transcript), true);
});
