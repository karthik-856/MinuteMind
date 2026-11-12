export const TRANSCRIBE_MODEL = "gpt-4o-transcribe-diarize";
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const ALLOWED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".ogg",
  ".flac",
] as const;

export interface DiarizedSegment {
  speaker?: string;
  text: string;
  start?: number;
  end?: number;
}

export interface FormattedTranscript {
  transcript: string;
  speakers: string[];
  durationMinutes?: number;
}

const EXT_RE = /\.[a-z0-9]+$/i;

export function audioExtension(name: string): string {
  return name.match(EXT_RE)?.[0]?.toLowerCase() ?? "";
}

export function isAllowedAudioFile(name: string, type?: string): boolean {
  const ext = audioExtension(name);
  if (ext && (ALLOWED_AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return true;
  }
  return Boolean(type?.startsWith("audio/") || type === "video/webm" || type === "video/mp4");
}

export function formatTimestamp(seconds?: number): string | undefined {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return undefined;
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function speakerNumber(raw: string | undefined, seen: Map<string, number>): number {
  const key = (raw ?? "unknown").trim() || "unknown";
  const existing = seen.get(key);
  if (existing) return existing;
  const next = seen.size + 1;
  seen.set(key, next);
  return next;
}

export function displaySpeaker(index: number): string {
  return `Speaker ${index}`;
}

export function formatDiarizedTranscript(
  segments: DiarizedSegment[],
  fallbackText = "",
  durationSeconds?: number,
): FormattedTranscript {
  const seen = new Map<string, number>();
  const lines: string[] = [];

  const cleaned = segments
    .map((segment) => ({
      ...segment,
      text: segment.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((segment) => segment.text.length > 0);

  if (!cleaned.length && fallbackText.trim()) {
    return {
      transcript: `${displaySpeaker(1)}: ${fallbackText.trim()}`,
      speakers: [displaySpeaker(1)],
      durationMinutes: durationSeconds
        ? Math.max(1, Math.round(durationSeconds / 60))
        : undefined,
    };
  }

  let current: { speaker: string; texts: string[]; start?: number } | null = null;

  function flush() {
    if (!current) return;
    const stamp = formatTimestamp(current.start);
    const prefix = stamp ? `[${stamp}] ${current.speaker}` : current.speaker;
    lines.push(`${prefix}: ${current.texts.join(" ")}`);
    current = null;
  }

  for (const segment of cleaned) {
    const speaker = displaySpeaker(speakerNumber(segment.speaker, seen));
    if (current && current.speaker === speaker) {
      current.texts.push(segment.text);
      continue;
    }
    flush();
    current = { speaker, texts: [segment.text], start: segment.start };
  }
  flush();

  const speakers = [...seen.values()]
    .sort((a, b) => a - b)
    .map((index) => displaySpeaker(index));

  return {
    transcript: lines.join("\n"),
    speakers,
    durationMinutes: durationSeconds
      ? Math.max(1, Math.round(durationSeconds / 60))
      : undefined,
  };
}

export function applySpeakerNames(
  transcript: string,
  names: Record<string, string>,
): string {
  const entries = Object.entries(names)
    .map(([from, to]) => [from.trim(), to.trim()] as const)
    .filter(([from, to]) => from && to && from !== to)
    .sort((a, b) => b[0].length - a[0].length);

  if (!entries.length) return transcript;

  return transcript
    .split("\n")
    .map((line) => {
      for (const [from, to] of entries) {
        const stamped = line.match(/^(\[\d{1,3}:\d{2}\]\s*)(.+)$/);
        const body = stamped ? stamped[2] : line;
        const prefix = stamped ? stamped[1] : "";
        if (body === from || body.startsWith(`${from}:`) || body.startsWith(`${from} (`)) {
          return `${prefix}${to}${body.slice(from.length)}`;
        }
      }
      return line;
    })
    .join("\n");
}

export function listTranscriptSpeakers(transcript: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const line of transcript.split("\n")) {
    const match = line.match(
      /^(?:\[\d{1,3}:\d{2}\]\s*)?([A-Za-z][A-Za-z0-9 .'-]{0,40}?)(?:\s*\([^)]+\))?\s*[:—-]\s+/,
    );
    const name = match?.[1]?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
