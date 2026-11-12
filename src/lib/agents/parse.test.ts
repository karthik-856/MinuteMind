import assert from "node:assert/strict";
import test from "node:test";
import { isPlausibleSpeakerName, parseTranscript } from "./parse";
import { SAMPLE_MEETINGS } from "../samples";

test("Campus Nav sample keeps four named attendees", () => {
  const sprint = SAMPLE_MEETINGS.find((sample) => sample.id === "sample-sprint");
  assert.ok(sprint);
  const parsed = parseTranscript(sprint.transcript);
  assert.deepEqual(
    parsed.attendees.map((person) => person.name),
    ["Tara Menon", "Dev Patel", "Sana Kapoor", "Riya Bose"],
  );
});

test("Gemini note lines are not attendees", () => {
  const parsed = parseTranscript(`The team defined a 10-week timeline for the demo.
Constraint on accessing real-world campus data remains open.
Let us know what you think about the rubric.
capstone project review meeting: mid-term slot
Chitla Karthik: Welcome everyone to the review.
Terli Vaishnavi: I will update the slides by Friday.
Transcription ended after 00:45`);
  assert.deepEqual(
    parsed.attendees.map((person) => person.name),
    ["Chitla Karthik", "Terli Vaishnavi"],
  );
});

test("Google Meet name-then-timestamp blocks become turns", () => {
  const parsed = parseTranscript(`Chitla Karthik
00:00:12
Welcome to the capstone review.
Terli Vaishnavi
00:00:45
I will send the recording after the call.`);
  assert.equal(parsed.turns.length, 2);
  assert.equal(parsed.turns[0]?.speaker, "Chitla Karthik");
  assert.equal(parsed.turns[0]?.timestamp, "00:00:12");
  assert.match(parsed.turns[1]?.text ?? "", /recording/);
});

test("implausible speaker names are rejected", () => {
  assert.equal(isPlausibleSpeakerName("The team defined a 10"), false);
  assert.equal(isPlausibleSpeakerName("Transcription ended after 00"), false);
  assert.equal(isPlausibleSpeakerName("Chitla Karthik"), true);
  assert.equal(isPlausibleSpeakerName("Speaker 1"), true);
});
