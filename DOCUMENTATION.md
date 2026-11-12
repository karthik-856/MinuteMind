# MinuteMind — Complete Project Documentation

Use this file as the single source of truth for the project. Paste it into ChatGPT (or any LLM) when you want new product, UX, research, or implementation ideas. It describes **what exists today**, not a wishlist.

**How to prompt ChatGPT with this doc**

1. Paste this entire file.
2. Add: “This is the current state of my student/hackathon project. Suggest ideas that fit this architecture. Do not assume a real multi-LLM agent graph, a database, or auth unless I ask.”
3. Ask a focused question (examples at the end).

---

## 1. One-sentence pitch

**MinuteMind** is a local-first, agentic meeting-intelligence web app that turns a speaker-labelled transcript into structured minutes, owned tasks, first-class risks, and scheduled follow-ups — so a meeting does not die as a chat dump.

Tagline used in the UI: **From conversation to execution.**

---

## 2. Problem statement (academic / product)

**Title-shaped problem:** *AI-Based Meeting Intelligence Platform for Automatic Minutes Generation, Task Tracking and Follow-up Management.*

The product must **not** look like “just a summarizer.” The story judges and advisors should see is:

```
transcript → Orchestrator → Scribe → Decision → Action → Risk → Follow-up → workspace
```

Three mapped product surfaces:

| Problem clause | Product surface |
| --- | --- |
| Automatic minutes generation | Minutes of Meeting document + Markdown export |
| Task tracking | Kanban board of extracted commitments |
| Follow-up management | Inbox of recaps, owner check-ins, open-question reminders |

Risks/blockers are a fourth first-class entity so the demo is not only “summary + todos.”

---

## 3. What this project is — and is not

**It is**

- A complete, runnable web slice of an agentic meeting workspace.
- A **six-specialist local pipeline** (regex / heuristic functions in TypeScript).
- A **browser workspace** persisted in `localStorage`, with JSON **export/import**.
- A **faculty-desk UI** (cream paper grain, navy sidebar, brass rules, serif headings, 3D quill feathers).
- Optional **audio ingestion**: `gpt-4o-transcribe-diarize` → Speaker 1 / Speaker 2 (user may rename).
- Optional **gap-fill**: `gpt-4o-mini` on unmatched sentences; kept only if the quote is in the transcript.

**It is not**

- A multi-LLM agent graph (LangGraph, CrewAI, AutoGen, etc.). The six agents are local functions.
- A RAG system. One transcript is not a retrieval corpus.
- A production SaaS (no login, no database). Follow-ups open mail/calendar **drafts**; nothing is sent.
- A model that invents attendee names or confidence scores.
- Dependent on an API key for the Campus Nav demo.

The **default** Process meeting path is always the local engine (520 ms step delay for the live trace). OpenAI is used only for **Upload recording** and optional **Fill missed items**.

---

## 4. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js **16.3.4** (App Router) |
| UI | React **19.2.8** |
| Language | TypeScript |
| Styling | Tailwind CSS **4**, `tw-animate-css` |
| Components | shadcn/ui **base-nova** on **Base UI** (`@base-ui/react`) |
| Icons | lucide-react |
| Toasts | sonner |
| Fonts | Geist (sans), Geist Mono, **Source Serif 4** (headings) |
| Persistence | `localStorage` key `minutemind-workspace-v1` + JSON backup |
| Optional STT | OpenAI `gpt-4o-transcribe-diarize` (`POST /api/transcribe`, 25 MB) |
| Optional gap-fill | OpenAI `gpt-4o-mini` (`POST /api/refine`), quote-checked |
| Package name | `minutemind` `0.1.0` (private) |

**Scripts**

- `npm run dev` — `next dev --hostname 127.0.0.1 --port 43127`
- `npm run build` / `npm start` — same host/port
- `npm run lint` — ESLint
- `npm test` — golden tests (`tsx --test`) for parse, Campus Nav pipeline, gap-fill quotes, backup JSON

**Config notes**

- `next.config.ts`: `devIndicators: false` (hides the Next.js issues widget).
- Path alias: `@/` → `src/`.
- No database, no auth library, no Three.js (3D feathers are CSS/SVG).

---

## 5. How to run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

First visit with empty storage **seeds three campus meetings** so Overview, Tasks, Risks, and Follow-ups are not empty.

**Live demo for judges:** **Process meeting** → load **Campus Nav App — Sprint Planning** → **Run agent pipeline**. Watch six agents, then open the meeting and walk Minutes → Tasks → Risks → Follow-ups.

**Reset:** Agents page → **Reset demo data** (clears `localStorage` and re-seeds).  
**Backup:** Agents page → **Export workspace** / **Import backup**.

If Overview/Risks look empty, the browser may hold an older workspace. Reset demo data.

### Optional audio + gap-fill

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. Restart the dev server.

- **Upload recording** on Process meeting → `POST /api/transcribe` (`gpt-4o-transcribe-diarize`). Rename Speaker 1 / Speaker 2, then run the local pipeline.
- Tick **Fill missed items** or use that button on a saved meeting → `POST /api/refine` (`gpt-4o-mini`). Hallucinated quotes are dropped.

---

## 6. High-level architecture

```
Browser (React)
  AppShell (navy sidebar + paper field)
    Pages (Overview, Meetings, Tasks, Risks, Follow-ups, Agents, Process)
      WorkspaceProvider (src/lib/store.tsx)
        localStorage  (+ export/import JSON)
        runPipeline()  ← local, 520ms delay per step for the live trace
        optional fillGaps() → POST /api/refine (quote-checked)

Optional:
  Upload recording → POST /api/transcribe (gpt-4o-transcribe-diarize)
  POST /api/process → runPipeline(); if fillGaps + key → refine-model
```

There is **no backend database**. API routes are optional HTTP entries for the same pipeline plus speech/gap-fill.

---

## 7. The six agents (local pipeline)

File: `src/lib/agents/pipeline.ts`  
Parser: `src/lib/agents/parse.ts`  
Catalog copy: `AGENT_CATALOG` in `src/lib/types.ts`

Order:

```
Orchestrator → Scribe → Decision → Action → Risk → Follow-up → Workspace
```

Each step becomes an `AgentStep` on `meeting.agentRun` (the **agent trace**). In the UI, `processMeeting` passes `delayMs: 520` so the live trace is watchable.

### 7.1 Orchestrator

**Input:** raw transcript string.  
**Work:** `parseTranscript()`.  
**Output:** attendees (name + optional role) and ordered speaking turns.

Parser rules (`TURN_PATTERN`):

- Optional timestamp: `[10:02]`
- Speaker name
- Optional role in parentheses: `(PM)`
- Separator: `:`, `—`, or a spaced hyphen (` - `). Hyphens inside words (`10-week`, `real-world`) are not speaker breaks.
- Speaker must look like a person name (or `Speaker N`). Gemini/Meet note lines and `Transcription ended after 00:45` are not attendees.
- Rest of line is the utterance
- Continuation lines without a speaker prefix append to the previous turn
- Google Meet blocks also parse: name on its own line, optional `00:00:12`, then the utterance
- If **no** labelled turns exist, one turn with speaker `Unknown` is created (tasks from that speaker become unassigned)

Example lines that parse:

```
Tara Menon (PM): Welcome to sprint planning…
[10:02] Meera Nair (Placement Officer): Welcome to the kickoff…
Chitla Karthik
00:00:12
Welcome to the capstone review.
```

### 7.2 Scribe

**Work:** cluster turns into discussion topics, write agenda + executive summary.

Clustering:

- Start a new cluster when a turn matches topic markers **and** the current cluster already has > 2 turns
- Topic markers: `next`, `moving on`, `let's talk/discuss/cover/look at`, `agenda item`, `on the topic of`, `regarding`, `switching to`, `now for`
- Also flush a cluster at 8 turns
- Topic title inferred from “about/regarding/on/for/around X”, from a noun list (demo, budget, sprint, ethics, …), or from the first sentence

Executive summary: meeting title + attendee first names + up to 3 discussion highlights, clipped to 420 characters.

### 7.3 Decision

Scans sentences for decision language:

```
we decided|agreed|will go with|approved|chose|settled on
decision:
let's go with|do|use|ship
approved|signed off|locking in|final call|final decision
```

Each hit becomes a `Decision` with `text`, `decidedBy` (speaker), `quote` (source sentence). Deduped, max **40**.

### 7.4 Action

Extracts commitments into `Task` records (max **80**, deduped by owner+title).

Action markers:

```
I'll|I will|I can|I am going to
we'll|we will|we need to|need you to|take the lead
please | can you | could you
will take|send|draft|finish|update|share|schedule|prepare|review
action item: | assigned to | owner:
```

Also accepts sentences with `by Monday|Tuesday|…|next week` even without the markers.

Skips pure decision sentences that do not also match action markers.

**Owner resolution** (`OwnerResolution`):

| Code | Meaning |
| --- | --- |
| `speaker` | First person (“I’ll”, “I will”, …) and speaker is not Unknown |
| `named` | “Name will/can/to/should/please” matched an attendee |
| `addressed` | “please Name”, “can you Name”, Name + take/send/draft/… |
| `attendee-mention` | Another attendee’s first name appears in the sentence |
| `fallback-speaker` | No other owner; use the speaker |
| `unassigned` | Speaker is Unknown / empty |
| `manual` | User assigned later in the task sheet |

Empty / `Unknown` / `Unassigned` / `Needs owner` display as **Unassigned**.

**Due dates** (`src/lib/dates.ts` `resolveRelativeDate`, relative to meeting date):

- today / tonight / eod / by today
- tomorrow
- next week (+7 days)
- end of the month
- in N days
- weekday names (`this Friday`, `by Monday`, `next Thursday`)
- ordinals (`by the 12th`, `on 3 March`)

`dueDateSource`: `explicit` or `none`.

**Priority** (`TaskPriority`: low / medium / high / urgent):

- Explicit: asap, urgent, today, blocker, critical, immediately → urgent; high priority, important, this week, must → high; nice to have, whenever, low priority, later → low
- Inferred from deadline: due in ≤1 day → urgent; ≤3 days → high
- Else medium (`prioritySource`: `explicit` | `inferred-deadline` | `default`)

New tasks start as `status: "open"`. Title is cleaned (strip “I’ll”, owner name, please/will, …) and clipped to 110 chars. Titles shorter than 12 chars are dropped.

### 7.5 Risk

Risk markers:

```
blocker|blocked|risk|concern|worried|might slip|delay|dependency|at risk|slipping|not sure we can|waiting on
```

Creates first-class `Risk` objects (max **40**) with description, source quote, `raisedBy`, optional `relatedTaskId` if the sentence overlaps a task quote.

Open questions (separate strings on minutes, max **40**):

```
do we know|what about|open question|still unclear|need clarity|can we confirm
or sentence ends with ?
```

### 7.6 Follow-up

Always schedules:

1. **Recap** (`kind: recap`) — day after the meeting, recipient = all attendees, note to share minutes/decisions/actions.
2. **Task check-in** (`kind: task-checkin`) — one per task, scheduled the day **before** the due date (or due date if that would be before the meeting). Recipient = owner or “Needs owner”.
3. **Open questions** (`kind: open-questions`) — if any questions, +2 days, recipient = first attendee.

Statuses: `scheduled` | `sent` | `acknowledged` | `done`.

Follow-ups are **not sent by the server**. The inbox offers **Email draft** (`mailto:`), **Copy message**, and **Calendar .ics**. Mark sent only after the human actually sends.

### 7.7 Caps and IDs

Defined as `EXTRACTION_CAPS` in `pipeline.ts`:

| Artifact | Max per meeting |
| --- | --- |
| Agenda topics | 16 |
| Decisions | 40 |
| Tasks | 80 |
| Risks | 40 |
| Open questions | 40 |

IDs: `mtg_`, `run_`, `step_`, `dec_`, `tsk_`, `rsk_`, `fu_` + 8 hex chars from `crypto.randomUUID`.

Duration if not provided: `clamp(round(turns * 1.4), 20, 90)` minutes.

---

## 8. Data model

All types live in `src/lib/types.ts`.

### Workspace

```ts
WorkspaceData = {
  meetings: Meeting[]
  tasks: Task[]
  followUps: FollowUp[]
  risks: Risk[]
}
```

### Meeting

- `id`, `title`, `date` (ISO `YYYY-MM-DD`), `durationMinutes`
- `attendees: { name, role? }[]`
- `source: "paste" | "upload" | "sample" | "recording"`
- `transcript` (full text)
- `status: "draft" | "processing" | "ready" | "failed"`
- `minutes?` (Minutes)
- `agentRun?` (AgentRun)
- `createdAt` (ISO datetime)

### Minutes

- `executiveSummary`
- `agenda: string[]`
- `discussion: { topic, summary, speakers[] }[]`
- `decisions: Decision[]`
- `risks: string[]` (human-readable, often `"Name: sentence"`)
- `openQuestions: string[]`

### Task / FollowUp / Risk

See section 7. Risks are **not** only strings on minutes; they are workspace rows with `status: open | monitoring | resolved`.

### AgentRun

- `engine: "local" | "llm"` (`llm` if gap-fill or a refined summary was applied)
- `steps: AgentStep[]` with `pending | running | done | failed`

---

## 9. Workspace store (client state)

File: `src/lib/store.tsx`

- Hydrates from `localStorage` or `buildSeed()`.
- `normalizeWorkspace()` migrates old saves (missing `Risk[]`, missing provenance fields).
- Every change after `ready` is written back to `localStorage`.

**API**

| Method | Effect |
| --- | --- |
| `processMeeting(input, onProgress, { fillGaps? })` | Local pipeline (520ms/step); optional quote-checked gap-fill; upserts that meeting (same `meetingId` = re-run in place) |
| `fillGaps(meetingId)` | Model pass on unmatched sentences; does not wipe existing local items |
| `replaceWorkspace` | Loads a parsed backup JSON |
| `updateTaskStatus` | open / in_progress / done / blocked |
| `updateTaskOwner` | Sets owner + `ownerResolution: manual`; syncs linked follow-up recipient |
| `updateFollowUpStatus` | scheduled / sent / acknowledged / done |
| `updateRiskStatus` | open / monitoring / resolved |
| `deleteMeeting` | Removes meeting and all linked tasks, follow-ups, risks |
| `resetWorkspace` | Clears storage and re-seeds |

`WorkspaceReady` waits for `ready` before rendering pages that need data.

---

## 10. Seed / sample meetings

File: `src/lib/samples.ts`, seeder `src/lib/seed.ts`.

**Seeded on first visit** (pipeline run with `delayMs: 0`, then demo status paint):

| ID | Title | Days ago | Demo progress |
| --- | --- | --- | --- |
| `sample-fyp` | FYP Review — MinuteMind Sprint 6 | 4 | First task in progress |
| `sample-placement` | Placement Cell × Nimbus Labs Kickoff | 7 | First task done, second in progress |
| `sample-ethics` | Department Research Ethics Check-in | 14 | Mixed task/follow-up/risk statuses |

**Not seeded** (left for the live run):

| ID | Title | Purpose |
| --- | --- | --- |
| `sample-sprint` | Campus Nav App — Sprint Planning | Default text in Process meeting |

Transcripts are campus-flavoured (advisor review, placement kickoff, ethics, sprint planning) with labelled speakers, decisions, “I’ll…”, blockers, and open questions so all six agents fire.

---

## 11. Routes and UX

Shell: navy sidebar (Overview, Meetings, Tasks, Risks, Follow-ups, Agents) + **Process meeting**. Mobile: hamburger sheet.

### `/` Overview (command center)

- Desk-panel hero (paper grain, brass rule, 3D quill that tilts with the pointer)
- CTA: Process a transcript · note that Campus Nav is the live demo
- Clickable pipeline ribbon: Transcript → Minutes → Decisions → Tasks → Risks → Follow-ups
- Four stats (links): open tasks, overdue tasks, upcoming follow-ups, open/monitoring risks
- **Needs attention** (max 8, ranked): overdue tasks, open risks, unassigned owners, due-soon (≤3 days), follow-ups waiting on ack (`sent`)
- Recent meetings
- Follow-up queue (5) and open risks (5)

### `/meetings`

List of meetings with task/risk/follow-up counts. Cards tilt on hover.

### `/meetings/new` — Process a meeting

Form: title, date, duration, transcript (paste or `.txt/.md` upload), **Upload recording**. Campus sample buttons. Live agent trace while running. Default sample is Campus Nav sprint planning. Checkbox: fill missed items with `gpt-4o-mini` (enabled when `GET /api/refine` says a key is present).

Validation: title required; transcript must be ≥ 40 characters. Audio max 25 MB.

On success: toast + navigate to `/meetings/[id]`.

### `/meetings/[id]`

Tabs (query `?tab=`):

- **Minutes** — letterhead MoM (summary, attendees, agenda, discussion, decisions with quotes, action table, risks/questions). Download Markdown. Action titles open the task sheet (`/tasks?id=`).
- **Tasks / Risks / Follow-ups** — rows that deep-link to global boards with sheets
- **Agent trace** — stored run
- **Transcript** — raw text

**Re-run pipeline** replaces that meeting’s derived artifacts in place (same id). **Fill missed items** calls refine without wiping the local board. **Remove from workspace** deletes the meeting and linked work.

### `/tasks`

Kanban: Open, In progress, Blocked, Done.  
Query: `?id=` opens task sheet; `?filter=overdue`.  
Owner filter: Everyone / Unassigned / named owners.  
Card: Extracted label, owner, priority, status, due, meeting link. `⋯` changes status.

**Task sheet:** why created, source quote, owner/deadline/priority explanations, assign owner (datalist of attendee names), Start / Mark done / View source transcript.

### `/risks`

List of risks. `?id=` opens sheet (why detected, quote, raised by, related task, status updates).

### `/follow-ups`

Filters: All, Overdue, Scheduled, Sent (includes acknowledged), Done.  
Row actions: **Email draft**, **Copy message**, **Calendar .ics**, then Mark sent / Acknowledged / Done / Reopen.  
Sheet explains recap vs check-in vs open questions and shows the meeting/task chain. Drafts are not auto-sent.

### `/agents`

Architecture explainer. Interactive agent list (input/output + last saved trace for that specialist). **Export workspace**, **Import backup**, Reset demo data. Technical details: local engine, optional STT + quote-checked gap-fill.

---

## 12. Provenance (explainability)

File: `src/lib/provenance.ts`

The UI can answer:

- Why this task exists (spoken commitment)
- How the owner was resolved
- How the deadline was resolved
- Why priority is what it is
- Why a follow-up exists
- Why a risk was flagged (blocker/slip language)

This is important for a viva: the system is **extractive**, not a black-box summary.

---

## 13. Visual design

**Identity**

- Cream / off-white paper background with a light grain (`--paper`, `--background` in OKLCH, hue ~88)
- Dark navy sidebar with a brass hairline (`--sidebar`)
- Forest teal primary (`--primary` ~168)
- Brass / gold kickers and `.ink-rule` under titles (`--brass`)
- Desk panels (`.desk-panel`) and folio cards (`.folio`)
- Serif headings (`Source Serif 4` as `--font-heading`)
- Status colour: green done, red overdue, amber monitoring/blocked, sky in-progress

**Motion / 3D (no WebGL)**

- Layered SVG quill (`Feather3D`) with `preserve-3d`, pointer tilt (`usePointerTilt`)
- Ambient drifting feathers (`FeatherField`)
- Card tilt (`TiltSurface`) on overview stats and meeting list
- Paper sheen on hero panels
- Respects `prefers-reduced-motion`

**Component library**

shadcn primitives: Button, Card, Input, Textarea, Tabs, Sheet, Badge, Dropdown, Tooltip, etc. Link-as-button uses Base UI `render={<Link/>}` with `nativeButton` false.

---

## 14. HTTP API

`POST /api/process`  
Body JSON: `{ title?, date, durationMinutes?, transcript, source? }`  
Requires `transcript` and `date`.

Returns `ProcessResult`: `{ meeting, tasks, followUps, risks }`.

If `fillGaps: true` and `OPENAI_API_KEY` is set, `gpt-4o-mini` proposes extra decisions/tasks/risks. An item is kept only when its quote is a verbatim substring of the transcript. Failures fall back to the local result.

`GET /api/refine` reports whether a key is configured. The Process meeting UI can opt in after the local agents. Meeting detail can **Re-run pipeline** in place or **Fill missed items**.

---

## 15. Markdown export

`minutesToMarkdown(meeting, tasks)` produces a classic MoM:

1. Executive summary  
2. Agenda  
3. Discussion  
4. Decisions  
5. Action items (checkboxes)  
6. Risks and open questions  

Downloaded as `{slug}-minutes.md` from the minutes view.

---

## 16. File map

```
src/app/
  layout.tsx                 fonts, AppShell, Providers
  globals.css                tokens, paper washes, feather animations
  page.tsx                   Overview
  meetings/page.tsx          meeting list
  meetings/new/page.tsx      process transcript
  meetings/[id]/page.tsx     meeting workspace tabs
  tasks/page.tsx             kanban
  risks/page.tsx
  follow-ups/page.tsx
  agents/page.tsx
  api/process/route.ts       optional HTTP pipeline
  api/refine/route.ts        quote-checked gap fill
  api/transcribe/route.ts    audio STT + diarization

src/lib/
  types.ts                   all domain types + AGENT_CATALOG
  store.tsx                  WorkspaceProvider
  agents/parse.ts            transcript parser
  agents/pipeline.ts         six agents + markdown
  agents/gaps.ts             quote-checked merge for model proposals
  workspace-backup.ts        JSON export/import
  handoff.ts                 mailto / copy / .ics drafts
  samples.ts                 four campus transcripts
  seed.ts                    first-visit workspace
  dates.ts                   relative dates, overdue, en-IN formatting
  owners.ts                  Unassigned display
  provenance.ts              explainability copy
  attention.ts               Overview “needs attention”
  normalize.ts               localStorage migrations
  format.ts                  status labels

src/components/
  app-shell.tsx              nav + paper field
  minutes-document.tsx
  agent-trace.tsx
  follow-up-actions.tsx      mailto / copy / .ics
  workspace-backup-controls.tsx
  task/follow-up/risk-detail-sheet.tsx
  feather-3d.tsx, feather-svg.tsx, feather-field.tsx, tilt-surface.tsx
  flow-ribbon.tsx, page-header.tsx, empty-state.tsx, brand-mark.tsx
  ui/*                       shadcn

src/hooks/
  use-pointer-tilt.ts
  use-reduced-motion.ts
```

---

## 17. Intentional non-goals (do not “fix” these unless asked)

- No user accounts, multi-device sync, or Postgres (export/import JSON instead)
- No automatic email/Slack send — follow-ups open a draft you send yourself
- No in-app microphone recording (file upload + paste only)
- No confidence percentages or fake model latency besides the 520ms demo delay
- No second component library
- Default engine stays local so a viva works offline

---

## 18. Evaluation notes (report / viva)

You can score:

1. **Minutes quality** — does the MoM match the transcript (topics, decisions, quotes)?
2. **Task extraction** — owners, dates, priority vs spoken commitments (precision/recall / F1 on a labelled set).
3. **Follow-up usefulness** — recap + deadline check-ins + open questions.
4. **Agent evidence** — stored trace, live run on Campus Nav sample.
5. **Explainability** — source quotes and owner/deadline provenance.

A canned sample always works without network or a model. `npm test` runs golden checks on Campus Nav extraction, Meet-note attendee filtering, and quote-checked gap fill.

---

## 19. Known limitations (honest)

- Heuristic extractors miss paraphrase, sarcasm, and “we should maybe…” commitments unless optional gap-fill is on and the model quotes the line.
- Relative weekdays (`next Friday`) can still land on the wrong week in edge cases.
- Unlabelled transcripts collapse to speaker Unknown → unassigned tasks.
- Extraction caps are high (80 tasks, 40 decisions) but still finite.
- Follow-ups are drafts (mailto / copy / `.ics`); MinuteMind never sends mail.
- Workspace is per-browser unless you export/import a backup JSON.
- Audio upload is capped at 25 MB (OpenAI transcription limit).
- 3D feathers are decorative CSS/SVG, not a physics engine.

---

## 20. Suggested ChatGPT prompts (after pasting this file)

- “Propose 8 features that stay local-first and still look agentic, ranked by demo impact vs implementation risk.”
- “Design a labelled evaluation set and metrics for the Action agent without calling it a neural model.”
- “How should we evaluate quote-checked gap-fill without calling the six agents an LLM graph?”
- “UX ideas to make provenance more visible to a non-technical advisor.”
- “What would a real Follow-up agent send, and how would I mock it in this UI?”
- “Where will regex fail on Indian English campus meetings, and how should I extend markers?”
- “Propose a report outline mapping this repo to the problem statement.”

When asking for code, specify: Next.js App Router, TypeScript, Tailwind 4, shadcn Base UI, no new auth/database unless requested.

---

## 21. Viva facts (copy these)

**Pitch:** One transcript becomes minutes, decisions, owned tasks, risks, and follow-ups, each with a source quote.

**Models**

| Layer | What runs |
| --- | --- |
| Six agents (default UI) | Local TypeScript pipeline — **no neural model** |
| Upload recording | `gpt-4o-transcribe-diarize` (STT + diarization only) |
| Fill missed items (optional) | `gpt-4o-mini`, item kept only if `quote` is in the transcript |
| RAG / six ChatGPTs | **Not used** |

**Demo:** Process meeting → Campus Nav App — Sprint Planning → Run agent pipeline → Minutes → task quote → Risks → Follow-ups → Agents.

**Phone audio:** Upload the file, rename Speaker 1 / Speaker 2, then run. An unlabelled paste becomes Unknown; “I’ll” stays unassigned.

**Honest limits:** no login/DB, drafts not sent mail, 25 MB audio, English cue-phrase extraction unless gap-fill is on.
