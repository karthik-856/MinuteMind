"use client";

import { AgentTrace } from "@/components/agent-trace";
import { PageHeader } from "@/components/page-header";
import { WorkspaceReady } from "@/components/workspace-ready";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isoDate } from "@/lib/dates";
import { SAMPLE_MEETINGS } from "@/lib/samples";
import { useWorkspace } from "@/lib/store";
import { applySpeakerNames, isAllowedAudioFile, MAX_AUDIO_BYTES } from "@/lib/transcribe";
import type { AgentStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AudioLinesIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TranscribePhase = "idle" | "transcribing" | "identifying" | "preparing" | "ready";

export default function NewMeetingPage() {
  return (
    <WorkspaceReady>
      <NewMeetingBody />
    </WorkspaceReady>
  );
}

function NewMeetingBody() {
  const router = useRouter();
  const { processMeeting } = useWorkspace();
  const sprint = SAMPLE_MEETINGS.find((sample) => sample.id === "sample-sprint")!;
  const [title, setTitle] = useState(sprint.title);
  const [date, setDate] = useState(isoDate(new Date()));
  const [duration, setDuration] = useState(String(sprint.durationMinutes));
  const [transcript, setTranscript] = useState(sprint.transcript);
  const [source, setSource] = useState<"paste" | "upload" | "sample" | "recording">("sample");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [transcribePhase, setTranscribePhase] = useState<TranscribePhase>("idle");
  const [baseTranscript, setBaseTranscript] = useState<string | null>(null);
  const [speakerDrafts, setSpeakerDrafts] = useState<Record<string, string>>({});
  const [fillGaps, setFillGaps] = useState(false);
  const [refineAvailable, setRefineAvailable] = useState(false);

  useEffect(() => {
    void fetch("/api/refine")
      .then((response) => response.json())
      .then((payload: { available?: boolean }) => {
        setRefineAvailable(Boolean(payload.available));
      })
      .catch(() => setRefineAvailable(false));
  }, []);

  const speakerHint = useMemo(() => {
    const lines = transcript.split("\n").filter((line) => /:/.test(line)).length;
    return lines;
  }, [transcript]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
    setSource("upload");
    setAudioName(null);
    setBaseTranscript(null);
    setSpeakerDrafts({});
    setTranscribePhase("idle");
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function onAudio(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!isAllowedAudioFile(file.name, file.type)) {
      setError("That file type is not supported. Use MP3, WAV, M4A, or WebM.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("That recording is larger than 25 MB. Trim it or export a smaller file.");
      return;
    }

    setAudioName(file.name);
    setTranscribePhase("transcribing");
    setSteps([]);
    if (!title.trim() || title === sprint.title) {
      setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    }

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/transcribe", { method: "POST", body });
      const payload = (await response.json()) as {
        error?: string;
        transcript?: string;
        speakers?: string[];
        durationMinutes?: number;
      };
      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error || "Transcription failed.");
      }

      setTranscribePhase("identifying");
      const speakers = payload.speakers ?? [];
      const drafts = Object.fromEntries(speakers.map((name) => [name, name]));
      setSpeakerDrafts(drafts);

      setTranscribePhase("preparing");
      setBaseTranscript(payload.transcript);
      setTranscript(payload.transcript);
      setSource("recording");
      if (payload.durationMinutes) {
        setDuration(String(payload.durationMinutes));
      }
      setTranscribePhase("ready");
      toast.success("Transcript ready. Review speakers, then run the pipeline.");
    } catch (cause) {
      setTranscribePhase("idle");
      setError(cause instanceof Error ? cause.message : "Could not transcribe that recording.");
      toast.error("Transcription failed.");
    }
  }

  function renameSpeaker(original: string, next: string) {
    setSpeakerDrafts((current) => {
      const drafts = { ...current, [original]: next };
      if (baseTranscript) {
        setTranscript(applySpeakerNames(baseTranscript, drafts));
      }
      return drafts;
    });
  }

  async function run() {
    setError(null);
    if (transcript.trim().length < 40) {
      setError("Paste a longer transcript so the agents have something to work with.");
      return;
    }
    if (!title.trim()) {
      setError("Give the meeting a title before running the pipeline.");
      return;
    }

    setBusy(true);
    setSteps([]);
    try {
      const result = await processMeeting(
        {
          title,
          date,
          durationMinutes: Number(duration) || undefined,
          transcript,
          source,
        },
        (step: AgentStep) => {
          setSteps((current) => {
            const next = current.filter((item) => item.id !== step.id);
            return [...next, step];
          });
        },
        { fillGaps: fillGaps && refineAvailable },
      );
      toast.success("Minutes, tasks, and follow-ups are ready.");
      router.push(`/meetings/${result.meeting.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The pipeline failed.");
      toast.error("Could not process this transcript.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        kicker="Pipeline"
        title="Process a meeting"
        description="Paste a speaker-labelled transcript, or upload a phone recording to transcribe first. The same six local agents then produce minutes, tasks, risks, and follow-ups."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="desk-panel space-y-4 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sprint review, advisor meeting, kickoff…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min={5}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="transcript">Transcript</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="transcript-file" className="text-xs text-primary hover:underline">
                  Upload .txt
                  <input
                    id="transcript-file"
                    name="transcript-file"
                    type="file"
                    accept=".txt,.md,.text"
                    className="sr-only"
                    onChange={(event) => void onFile(event.target.files?.[0])}
                  />
                </label>
                <label htmlFor="audio-file" className="text-xs text-primary hover:underline">
                  Upload recording
                  <input
                    id="audio-file"
                    name="audio-file"
                    type="file"
                    accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg,.ogg,.flac,audio/*"
                    className="sr-only"
                    onChange={(event) => {
                      void onAudio(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            {transcribePhase !== "idle" && transcribePhase !== "ready" ? (
              <p className="flex items-center gap-2 rounded-xl border border-primary/20 bg-paper px-3 py-2 text-sm">
                <Loader2Icon className="size-3.5 animate-spin text-primary" />
                {transcribePhase === "transcribing"
                  ? "Transcribing recording…"
                  : transcribePhase === "identifying"
                    ? "Identifying speakers…"
                    : "Preparing meeting transcript…"}
              </p>
            ) : null}

            {audioName && transcribePhase === "ready" ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <AudioLinesIcon className="size-3.5 text-primary" />
                From recording: {audioName}. Review the transcript before running the pipeline.
              </p>
            ) : null}

            {Object.keys(speakerDrafts).length > 0 && transcribePhase === "ready" ? (
              <div className="rounded-xl border border-brass/25 bg-paper p-3">
                <p className="kicker">Rename speakers</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Diarization labels people as Speaker 1, Speaker 2… Optional: type real names. We
                  do not invent them.
                </p>
                <ul className="mt-3 space-y-2">
                  {Object.keys(speakerDrafts).map((original) => (
                    <li key={original} className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
                      <Label htmlFor={`speaker-${original}`} className="text-xs">
                        {original}
                      </Label>
                      <Input
                        id={`speaker-${original}`}
                        name={`speaker-${original}`}
                        value={speakerDrafts[original] ?? original}
                        placeholder={original}
                        onChange={(event) => renameSpeaker(original, event.target.value)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Textarea
              id="transcript"
              name="transcript"
              value={transcript}
              onChange={(event) => {
                setTranscript(event.target.value);
                if (source === "recording") return;
                setSource("paste");
              }}
              className="min-h-[22rem] font-mono text-xs leading-5"
            />
            <p className="text-xs text-muted-foreground">
              Raw transcript · {speakerHint} labelled turns detected.
              {source === "recording" ? " Review this text, then run the pipeline." : ""}
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <label className="flex items-start gap-2.5 text-sm leading-5">
            <Checkbox
              checked={fillGaps && refineAvailable}
              disabled={!refineAvailable}
              onCheckedChange={(value) => setFillGaps(value === true)}
              className="mt-0.5"
            />
            <span>
              After the local agents, fill missed items with <span className="font-medium">gpt-4o-mini</span>.
              Every new item must quote the transcript.{" "}
              {refineAvailable
                ? "Key is configured on the server."
                : "Add OPENAI_API_KEY to .env.local to enable this."}
            </span>
          </label>

          <Button
            onClick={() => void run()}
            disabled={busy || (transcribePhase !== "idle" && transcribePhase !== "ready")}
            className="w-full sm:w-auto"
          >
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            {busy
              ? "Agents running…"
              : source === "recording"
                ? "Run MinuteMind pipeline"
                : "Run agent pipeline"}
          </Button>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campus samples</CardTitle>
              <CardDescription>
                Load a ready-made transcript. The sprint-planning sample is already in the editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE_MEETINGS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border bg-paper px-3 py-3 text-left outline-none transition-colors hover:border-primary/25 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring",
                    sample.id === "sample-sprint"
                      ? "border-primary/40 bg-white ring-1 ring-primary/20"
                      : "border-border/70",
                    title === sample.title && "border-primary/50",
                  )}
                  onClick={() => {
                    setTitle(sample.title);
                    setDuration(String(sample.durationMinutes));
                    setTranscript(sample.transcript);
                    setSource("sample");
                    setSteps([]);
                    setError(null);
                    setAudioName(null);
                    setBaseTranscript(null);
                    setSpeakerDrafts({});
                    setTranscribePhase("idle");
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-[15px] leading-snug">{sample.title}</p>
                    {sample.id === "sample-sprint" ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Recommended live demo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sample.blurb}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className={cn(busy && "ring-1 ring-primary/25")}>
            <CardHeader>
              <CardTitle>Live agent trace</CardTitle>
              <CardDescription>
                Each specialist does one job — this is not a single LLM summary.
                Orchestrator → Scribe → Decision → Action → Risk → Follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {busy || steps.length ? (
                <AgentTrace steps={steps} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Press run to watch each specialist agent take a turn. The local engine
                  does not need a network call.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
