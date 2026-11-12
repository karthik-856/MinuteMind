# MinuteMind

Agentic meeting intelligence for **automatic minutes**, **task tracking**, and **follow-up management**. Built as a complete slice of a fourth-year agentic AI project: paste a transcript, watch six specialist agents hand work to each other, then work the resulting MoM, board, and reminder inbox.

No API key is required for pasted transcripts or the Campus Nav demo. The default engine is a local multi-agent pipeline that runs in the browser (and on `POST /api/process`). If `OPENAI_API_KEY` is set, **Upload recording** calls `POST /api/transcribe` (`gpt-4o-transcribe-diarize`) and **Fill missed items** calls `POST /api/refine` (`gpt-4o-mini`, quote-checked). The key stays on the server.

## What it does

1. **Minutes** — Scribe clusters the discussion, writes an executive summary, and formats a printable MoM.
2. **Tasks** — Action extracts owned commitments (`I'll…`, `please…`, `by Friday`) onto a status board.
3. **Follow-ups** — Follow-up schedules a recap for attendees, a check-in before each due date, and a reminder for open questions.

## Agent pipeline

```
Audio (optional) → Speech-to-text + diarization → Transcript
→ Orchestrator → Scribe → Decision → Action → Risk → Follow-up
```

| Agent | Artifact |
| --- | --- |
| Orchestrator | Speakers, roles, turn list |
| Scribe | Agenda, discussion points, summary |
| Decision | Explicit group decisions |
| Action | Tasks with owner, due date, priority |
| Risk | Blockers and unresolved questions |
| Follow-up | Recap + owner reminders |

Each step is stored on the meeting as an **agent trace**, which is the evidence trail for a viva or report.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). The first visit seeds three campus meetings so the overview, board, and inbox are not empty. Use **Process meeting** and the *Campus Nav App — Sprint Planning* sample to watch a live run.

### Optional audio + gap-fill

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. Then upload a recording, or tick **Fill missed items** on Process meeting. Re-run a saved meeting in place from the meeting page.

```bash
npm test
```

Campus Nav and Meet-note attendee parsing are covered by golden tests.

## Workspace data

Meetings, tasks, and follow-ups live in `localStorage` (`minutemind-workspace-v1`). **Export workspace** / **Import backup** on the Agents page. Reset from the same page. There is no login or database.

Follow-ups open an email draft, copy a message, or download a `.ics` file. MinuteMind does not send mail.

## Project layout

```
src/lib/agents/        parser, six-agent pipeline, quote-checked gap fill
src/lib/samples.ts     campus transcripts used for the demo
src/lib/handoff.ts     mailto / copy / .ics drafts
src/lib/workspace-backup.ts
src/app/api/transcribe audio STT + diarization
src/app/api/refine     optional gpt-4o-mini gap fill
src/app/api/process    optional HTTP entry for the same pipeline
src/app/               overview, meetings, tasks, follow-ups, agents
```

## Report notes

The problem statement maps directly onto the three product surfaces and the six-agent hand-off. Evaluation can score minutes quality (does the MoM match the transcript?), task extraction (owners and dates), and follow-up usefulness (recap + deadline reminders). A canned sample is included so the demo works without network or a model. Copy **§21 Viva facts** in `DOCUMENTATION.md` into slides — do not write “six LLMs” or “RAG.”

## Full project documentation

For a complete write-up you can paste into ChatGPT (architecture, agent rules, data model, routes, UI, samples, limitations, and idea prompts), see **[DOCUMENTATION.md](./DOCUMENTATION.md)**.
