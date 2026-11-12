import {
  formatDiarizedTranscript,
  isAllowedAudioFile,
  MAX_AUDIO_BYTES,
  TRANSCRIBE_MODEL,
  type DiarizedSegment,
} from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 120;

interface OpenAIDiarizedResponse {
  text?: string;
  duration?: number;
  usage?: { seconds?: number };
  segments?: Array<{
    speaker?: string;
    text?: string;
    start?: number;
    end?: number;
  }>;
  error?: { message?: string };
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return jsonError(
      "Audio transcription needs an OpenAI API key on the server. Add OPENAI_API_KEY to .env.local. Pasted transcripts still work without a key.",
      503,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected an audio file upload.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError("Choose an audio file to transcribe (MP3, WAV, M4A, or WebM).", 400);
  }

  if (!isAllowedAudioFile(file.name, file.type)) {
    return jsonError(
      "That file type is not supported. Use MP3, WAV, M4A, WebM, MP4, OGG, or FLAC.",
      415,
    );
  }

  if (file.size <= 0) {
    return jsonError("That recording is empty. Export the file again from your phone.", 400);
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return jsonError(
      "That recording is larger than 25 MB. Trim it or export a smaller MP3/M4A and try again.",
      413,
    );
  }

  const outbound = new FormData();
  outbound.append("file", file, file.name);
  outbound.append("model", TRANSCRIBE_MODEL);
  outbound.append("response_format", "diarized_json");
  outbound.append("chunking_strategy", "auto");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outbound,
    });
  } catch {
    return jsonError(
      "Could not reach OpenAI to transcribe this recording. Check the network and try again.",
      502,
    );
  }

  let payload: OpenAIDiarizedResponse;
  try {
    payload = (await upstream.json()) as OpenAIDiarizedResponse;
  } catch {
    return jsonError("The transcription service returned an unreadable response.", 502);
  }

  if (!upstream.ok) {
    const status = upstream.status;
    if (status === 401 || status === 403) {
      return jsonError("The server OpenAI API key was rejected. Check OPENAI_API_KEY.", 502);
    }
    if (status === 413) {
      return jsonError("OpenAI rejected the file as too large. Try a shorter clip.", 413);
    }
    if (status === 415 || status === 400) {
      return jsonError(
        "OpenAI could not read that audio file. Re-export as MP3 or WAV and try again.",
        415,
      );
    }
    return jsonError("Transcription failed. Try a clearer recording or a shorter clip.", 502);
  }

  const segments: DiarizedSegment[] = (payload.segments ?? [])
    .map((segment) => ({
      speaker: segment.speaker,
      text: segment.text ?? "",
      start: segment.start,
      end: segment.end,
    }))
    .filter((segment) => segment.text.trim());

  const fallback = payload.text?.trim() ?? "";
  const durationSeconds = payload.usage?.seconds ?? payload.duration;
  const formatted = formatDiarizedTranscript(segments, fallback, durationSeconds);

  if (formatted.transcript.replace(/\s+/g, " ").trim().length < 12) {
    return jsonError(
      "Almost no speech was detected. The recording may be silent, too quiet, or too short.",
      422,
    );
  }

  return Response.json({
    transcript: formatted.transcript,
    speakers: formatted.speakers,
    durationMinutes: formatted.durationMinutes,
    model: TRANSCRIBE_MODEL,
  });
}
