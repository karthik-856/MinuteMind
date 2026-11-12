import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_MEETINGS } from "../samples";
import { runPipeline } from "./pipeline";

test("Campus Nav pipeline extracts decisions, owned tasks, and a risk", async () => {
  const sprint = SAMPLE_MEETINGS.find((sample) => sample.id === "sample-sprint");
  assert.ok(sprint);
  const result = await runPipeline(
    {
      title: sprint.title,
      date: "2026-09-03",
      durationMinutes: sprint.durationMinutes,
      transcript: sprint.transcript,
      source: "sample",
    },
    undefined,
    { delayMs: 0 },
  );

  assert.equal(result.meeting.attendees.length, 4);
  assert.ok((result.meeting.minutes?.decisions.length ?? 0) >= 2);
  assert.ok(result.tasks.length >= 5);
  assert.ok(result.risks.length >= 1);
  assert.ok(result.followUps.some((item) => item.kind === "recap"));
  assert.ok(result.tasks.every((task) => task.sourceQuote));
  assert.ok(result.tasks.every((task) => !/^[,.;:?!-\s]|[,;]$/.test(task.title)));
  assert.ok(result.tasks.some((task) => /Dev Patel/i.test(task.owner)));
  assert.ok(
    result.meeting.minutes?.decisions.some((item) => /academic block|library/i.test(item.text)),
  );
});

test("unlabelled transcript does not invent attendees or owners", async () => {
  const result = await runPipeline(
    {
      title: "Phone dump",
      date: "2026-09-03",
      transcript: "I'll finish the slides by Friday. There is a blocker on the API key.",
      source: "paste",
    },
    undefined,
    { delayMs: 0 },
  );
  assert.deepEqual(result.meeting.attendees.map((person) => person.name), ["Unknown"]);
  assert.ok(result.tasks.every((task) => !task.owner));
});
