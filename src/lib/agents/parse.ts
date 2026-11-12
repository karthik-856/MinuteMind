import type { Attendee, TranscriptTurn } from "@/lib/types";

/** Colon, em dash, or a spaced hyphen — never a hyphen inside 10-week / real-world. */
const TURN_PATTERN =
  /^(?:\[(\d{1,3}:\d{2})\]\s*)?([A-Za-z][A-Za-z0-9 .'-]{0,40}?)(?:\s*\(([^)]+)\))?\s*(?::|—|\s+[–—-]\s+)\s*(.+)$/;

const NAME_TOKEN = /^[A-Za-z][A-Za-z'.’-]*$/;
const SPEAKER_ALIAS = /^(speaker\s+\d+|unknown)$/i;
const NAME_TITLE = /^(dr|prof|mr|mrs|ms|mx|sir)\.?$/i;

/** Words that appear in Gemini/Meet notes and must never become attendees. */
const SPEAKER_STOPWORDS = new Set([
  "a",
  "about",
  "accessing",
  "action",
  "after",
  "agenda",
  "an",
  "and",
  "at",
  "based",
  "capstone",
  "constraint",
  "defined",
  "ended",
  "for",
  "from",
  "gemini",
  "google",
  "in",
  "into",
  "items",
  "know",
  "let",
  "meeting",
  "minutes",
  "notes",
  "of",
  "on",
  "or",
  "our",
  "please",
  "project",
  "real",
  "recap",
  "review",
  "summary",
  "team",
  "thank",
  "thanks",
  "the",
  "their",
  "think",
  "this",
  "transcript",
  "transcription",
  "us",
  "we",
  "welcome",
  "what",
  "with",
  "you",
  "your",
]);

const REJECTED_SINGLE_WORDS = new Set([
  "action",
  "agenda",
  "approved",
  "chat",
  "comment",
  "decision",
  "error",
  "gemini",
  "google",
  "important",
  "item",
  "meet",
  "minutes",
  "note",
  "notes",
  "question",
  "recap",
  "summary",
  "system",
  "time",
  "title",
  "topic",
  "transcript",
  "update",
  "warning",
]);

export interface ParsedTranscript {
  turns: TranscriptTurn[];
  attendees: Attendee[];
  rawLines: string[];
}

export function isPlausibleSpeakerName(value: string): boolean {
  const name = cleanName(value);
  if (!name || name.length > 48) return false;
  if (SPEAKER_ALIAS.test(name)) return true;
  if (/transcription ended/i.test(name)) return false;

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) return false;

  const content = words.filter((word) => !NAME_TITLE.test(word));
  if (content.length === 0 || content.length > 4) return false;

  if (content.length === 1) {
    const single = content[0].toLowerCase().replace(/[.'’]/g, "");
    if (REJECTED_SINGLE_WORDS.has(single)) return false;
  }

  for (const word of content) {
    if (!NAME_TOKEN.test(word)) return false;
    const letters = word.replace(/[^A-Za-z]/g, "");
    if (letters.length < 2) return false;
    if (SPEAKER_STOPWORDS.has(word.toLowerCase().replace(/[.'’]/g, ""))) {
      return false;
    }
  }

  return true;
}

const CLOCK_LINE = /^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?$/;
const NAME_THEN_CLOCK =
  /^([A-Za-z][A-Za-z0-9 .'-]{0,40}?)\s+(\d{1,2}:\d{2}(?::\d{2})?)$/;

export function parseTranscript(transcript: string): ParsedTranscript {
  const rawLines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const turns: TranscriptTurn[] = [];
  const attendees = new Map<string, Attendee>();
  let pendingName: string | undefined;
  let pendingTs: string | undefined;

  const remember = (speaker: string, role?: string) => {
    const existing = attendees.get(speaker.toLowerCase());
    attendees.set(speaker.toLowerCase(), {
      name: speaker,
      role: role || existing?.role,
    });
  };

  const pushTurn = (
    speaker: string,
    text: string,
    timestamp?: string,
    role?: string,
  ) => {
    turns.push({
      index: turns.length,
      timestamp,
      speaker,
      role,
      text,
    });
    remember(speaker, role);
  };

  for (const line of rawLines) {
    const match = line.match(TURN_PATTERN);
    const speaker = match ? cleanName(match[2]) : "";
    if (match && isPlausibleSpeakerName(speaker)) {
      pendingName = undefined;
      pendingTs = undefined;
      pushTurn(speaker, match[4].trim(), match[1], match[3]?.trim());
      continue;
    }

    const clock = line.match(CLOCK_LINE);
    if (clock) {
      pendingTs = clock[1];
      continue;
    }

    const nameClock = line.match(NAME_THEN_CLOCK);
    if (nameClock && isPlausibleSpeakerName(cleanName(nameClock[1]))) {
      pendingName = cleanName(nameClock[1]);
      pendingTs = nameClock[2];
      continue;
    }

    if (isPlausibleSpeakerName(line) && !/[:—]/.test(line)) {
      pendingName = cleanName(line);
      continue;
    }

    if (pendingName) {
      pushTurn(pendingName, line, pendingTs);
      pendingName = undefined;
      pendingTs = undefined;
      continue;
    }

    if (turns.length > 0) {
      const last = turns[turns.length - 1];
      last.text = `${last.text} ${line}`.trim();
    }
  }

  if (turns.length === 0 && rawLines.length > 0) {
    turns.push({
      index: 0,
      speaker: "Unknown",
      text: rawLines.join(" "),
    });
    attendees.set("unknown", { name: "Unknown" });
  }

  return {
    turns,
    attendees: [...attendees.values()],
    rawLines,
  };
}

export function cleanName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

export function findAttendee(
  hint: string,
  attendees: Attendee[],
): Attendee | undefined {
  const needle = hint.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (!needle) return undefined;
  return attendees.find((person) => {
    const full = person.name.toLowerCase();
    const first = firstName(person.name).toLowerCase();
    return full === needle || first === needle || full.includes(needle);
  });
}

export function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12);
}
