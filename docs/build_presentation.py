#!/usr/bin/env python3
"""Generate the MinuteMind viva PowerPoint."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

NAVY = RGBColor(0x1A, 0x2F, 0x4A)
INK = RGBColor(0x1C, 0x2A, 0x3A)
EMERALD = RGBColor(0x1B, 0x8A, 0x6A)
GOLD = RGBColor(0xC4, 0x93, 0x2C)
IVORY = RGBColor(0xFB, 0xF6, 0xEC)
CREAM = RGBColor(0xF4, 0xEC, 0xD8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0x5A, 0x64, 0x72)
LIGHT = RGBColor(0xE8, 0xF3, 0xEE)

W = Inches(13.333)
H = Inches(7.5)


def set_run(run, text, size=18, bold=False, color=INK, font="Calibri"):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_text_box(slide, l, t, w, h, text, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    set_run(_first_run(p), text, size, bold, color, font)
    return box


def _first_run(p):
    if p.runs:
        return p.runs[0]
    return p.add_run()


def fill_shape(shape, color):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def kicker(slide, text, l=Inches(0.7), t=Inches(0.32)):
    add_text_box(slide, l, t, Inches(10), Inches(0.32), text.upper(), 11, True, GOLD, font="Calibri")


def title_bar(slide, title):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, Inches(0.12))
    fill_shape(bar, GOLD)
    kicker(slide, "MinuteMind  ·  Agentic AI")
    add_text_box(slide, Inches(0.7), Inches(0.55), Inches(12), Inches(0.6), title, 32, True, NAVY, font="Georgia")
    rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(1.18), Inches(1.4), Inches(0.04))
    fill_shape(rule, GOLD)


def bg(slide, color=IVORY):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    fill_shape(s, color)
    spTree = slide.shapes._spTree
    sp = s._element
    spTree.remove(sp)
    spTree.insert(2, sp)


def card(slide, l, t, w, h, fill=WHITE):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    fill_shape(sh, fill)
    sh.line.color.rgb = CREAM
    sh.adjustments[0] = 0.08
    return sh


def bullet_block(slide, l, t, w, h, items, size=16, color=INK):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = 0
        p.space_after = Pt(10)
        set_run(_first_run(p), "▸  " + item, size, False, color)
    return box


def footer(slide, n, total=14):
    add_text_box(
        slide,
        Inches(0.7),
        Inches(7.12),
        Inches(8),
        Inches(0.28),
        "MinuteMind  ·  From conversation to execution",
        11,
        False,
        MUTED,
    )
    add_text_box(slide, Inches(11.4), Inches(7.12), Inches(1.4), Inches(0.28), f"{n}  /  {total}", 11, False, MUTED, PP_ALIGN.RIGHT)


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]
    total = 14

    # 1 Title
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    accent = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.18), H)
    fill_shape(accent, GOLD)
    add_text_box(s, Inches(0.9), Inches(1.55), Inches(11.5), Inches(0.4), "AGENTIC AI  ·  PROJECT REVIEW", 14, True, GOLD)
    add_text_box(s, Inches(0.9), Inches(2.05), Inches(11.5), Inches(1.4), "MinuteMind", 60, True, WHITE, font="Georgia")
    add_text_box(
        s,
        Inches(0.9),
        Inches(3.45),
        Inches(11),
        Inches(0.9),
        "From conversation to execution",
        28,
        False,
        CREAM,
        font="Georgia",
    )
    add_text_box(
        s,
        Inches(0.9),
        Inches(4.5),
        Inches(11),
        Inches(0.8),
        "A local-first agentic workspace that turns a meeting transcript\ninto minutes, decisions, owned tasks, risks, and follow-ups.",
        18,
        False,
        RGBColor(0xC8, 0xD4, 0xE0),
    )
    add_text_box(
        s,
        Inches(0.9),
        Inches(6.35),
        Inches(11),
        Inches(0.5),
        "Six specialist agents  ·  Provenance with source quotes  ·  Optional speech model for audio only",
        14,
        False,
        GOLD,
    )
    notes(
        s,
        "Sir, MinuteMind is our agentic meeting-intelligence project. One sentence: a transcript becomes minutes, decisions, owned tasks, risks, and follow-ups — each with a quote from the meeting. I will show the architecture, the models we actually used, then a live demo.",
    )

    # 2 Problem
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "The problem")
    cards = [
        ("Meetings die as chat dumps", "Notes live in WhatsApp, Meet recaps, or a Google Doc. Nothing becomes owned work."),
        ("Summarizers are not accountable", "A single LLM recap can invent a decision that nobody said."),
        ("Follow-up is manual", "Owners, due dates, and blockers are lost after the call ends."),
    ]
    for i, (h, b) in enumerate(cards):
        x = Inches(0.7 + i * 4.1)
        card(s, x, Inches(1.7), Inches(3.85), Inches(3.6), WHITE)
        num = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.28), Inches(1.95), Inches(0.42), Inches(0.42))
        fill_shape(num, EMERALD)
        add_text_box(s, x + Inches(0.28), Inches(1.98), Inches(0.42), Inches(0.38), str(i + 1), 14, True, WHITE, PP_ALIGN.CENTER)
        add_text_box(s, x + Inches(0.28), Inches(2.55), Inches(3.3), Inches(1.1), h, 20, True, NAVY, font="Georgia")
        add_text_box(s, x + Inches(0.28), Inches(3.7), Inches(3.3), Inches(1.3), b, 15, False, MUTED)
    footer(s, 2, total)
    notes(
        s,
        "Campus meetings produce a recording or a Gemini recap and then nothing happens. We are not building another chatbot. We are building a workspace that turns speech into execution, with proof.",
    )

    # 3 Solution
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "What we built")
    add_text_box(
        s,
        Inches(0.7),
        Inches(1.45),
        Inches(12),
        Inches(0.5),
        "One transcript → a structured meeting workspace — not a chat window.",
        18,
        False,
        MUTED,
    )
    rows = [
        ("Minutes", "Scribe agent", "MoM: summary, agenda, discussion, decisions"),
        ("Tasks", "Action agent", "Owned commitments with due date and priority"),
        ("Risks", "Risk agent", "Blockers as first-class items, not a task flag"),
        ("Follow-ups", "Follow-up agent", "Recap + owner check-ins as drafts you send"),
    ]
    for i, (a, b, c) in enumerate(rows):
        y = Inches(2.1 + i * 1.05)
        card(s, Inches(0.7), y, Inches(12), Inches(0.92), WHITE)
        add_text_box(s, Inches(0.95), y + Inches(0.18), Inches(2.4), Inches(0.55), a, 20, True, EMERALD, font="Georgia")
        add_text_box(s, Inches(3.5), y + Inches(0.22), Inches(3.2), Inches(0.5), b, 16, True, GOLD)
        add_text_box(s, Inches(6.8), y + Inches(0.22), Inches(5.6), Inches(0.5), c, 16, False, INK)
    footer(s, 3, total)
    notes(
        s,
        "Map this to the problem statement: automatic minutes, task tracking, follow-up management. Risks are extra so it is not only summary plus todos.",
    )

    # 4 Architecture
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Agentic architecture — not six LLMs")
    steps = [
        "Transcript",
        "Orchestrator",
        "Scribe",
        "Decision",
        "Action",
        "Risk",
        "Follow-up",
        "Workspace",
    ]
    for i, name in enumerate(steps):
        x = Inches(0.35 + i * 1.62)
        sh = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.85), Inches(1.48), Inches(1.15))
        fill_shape(sh, NAVY if i not in (0, 7) else EMERALD)
        sh.adjustments[0] = 0.12
        add_text_box(s, x, Inches(2.15), Inches(1.48), Inches(0.6), name, 12, True, WHITE, PP_ALIGN.CENTER)
        if i < len(steps) - 1:
            add_text_box(s, x + Inches(1.32), Inches(2.15), Inches(0.35), Inches(0.5), "→", 16, True, GOLD, PP_ALIGN.CENTER)
    points = [
        "We used an agent architecture: each specialist has one job, a typed output, and a visible trace.",
        "The six agents are local TypeScript functions (regex + speaker-turn parsing) — deterministic.",
        "Same transcript → same board. Judges can re-run Campus Nav and get the same tasks.",
        "A foundation model is used only where the problem is perceptual: speech → who said what.",
    ]
    bullet_block(s, Inches(0.7), Inches(3.4), Inches(12), Inches(3.2), points, 17)
    footer(s, 4, total)
    notes(
        s,
        "If sir asks 'which models for the six agents?' — none. Architecture is agentic; inference for the board is heuristic. Do not say LangChain or AutoGen.",
    )

    # 5 Six agents
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "The six specialists")
    agents = [
        ("1  Orchestrator", "Parse speakers and turns; route work."),
        ("2  Scribe", "Agenda, discussion clusters, executive summary."),
        ("3  Decision", "Cue phrases: we decided, let’s go with, approved."),
        ("4  Action", "I’ll / please / by Friday → owner, due date, priority."),
        ("5  Risk", "Blocker, might slip, waiting on — first-class risks."),
        ("6  Follow-up", "Recap tomorrow; check-in before each due date."),
    ]
    for i, (h, b) in enumerate(agents):
        col, row = i % 3, i // 3
        x = Inches(0.7 + col * 4.15)
        y = Inches(1.65 + row * 2.35)
        card(s, x, y, Inches(3.95), Inches(2.15), WHITE)
        add_text_box(s, x + Inches(0.25), y + Inches(0.28), Inches(3.45), Inches(0.55), h, 18, True, NAVY, font="Georgia")
        add_text_box(s, x + Inches(0.25), y + Inches(0.9), Inches(3.45), Inches(0.95), b, 15, False, MUTED)
    footer(s, 5, total)
    notes(
        s,
        "Walk left to right. Orchestrator is routing, not an LLM. Decision and Action look for English cue phrases. Follow-up does not send email — it writes drafts.",
    )

    # 6 Models
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "What models we used — precisely")
    headers = ["Layer", "What it is", "Model"]
    data = [
        ["Six agents (demo path)", "Local regex + speaker parsing in the browser", "No neural model"],
        ["Upload recording", "Speech-to-text + diarization only", "gpt-4o-transcribe-diarize"],
        ["Fill missed items (optional)", "Second pass; keep only if quote is in transcript", "gpt-4o-mini"],
        ["RAG / six ChatGPTs", "Not a retrieval problem; one transcript", "Not used"],
    ]
    # header row
    for i, h in enumerate(headers):
        widths = [Inches(3.3), Inches(5.5), Inches(3.2)]
        x = Inches(0.7) + sum(widths[:i])
        sh = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, Inches(1.65), widths[i], Inches(0.55))
        fill_shape(sh, NAVY)
        add_text_box(s, x + Inches(0.12), Inches(1.74), widths[i] - Inches(0.2), Inches(0.4), h, 14, True, WHITE)
    for r, row in enumerate(data):
        y = Inches(2.2 + r * 0.7)
        for i, cell in enumerate(row):
            widths = [Inches(3.3), Inches(5.5), Inches(3.2)]
            x = Inches(0.7) + sum(widths[:i])
            sh = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, widths[i], Inches(0.7))
            fill_shape(sh, WHITE if r % 2 == 0 else LIGHT)
            add_text_box(s, x + Inches(0.12), y + Inches(0.16), widths[i] - Inches(0.2), Inches(0.45), cell, 14, i == 2, INK if i != 2 else EMERALD)
    add_text_box(
        s,
        Inches(0.7),
        Inches(5.2),
        Inches(12),
        Inches(1.4),
        "One sentence if interrupted: we used one speech model where the input is audio, and deterministic agents where the output must be auditable.",
        16,
        True,
        NAVY,
    )
    footer(s, 6, total)
    notes(
        s,
        "This is the most important slide. Do not say we used GPT-4 for every agent. UI does not call six models. Key is server-side. Campus Nav works with no key.",
    )

    # 7 Provenance
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Provenance — why this is not a black box")
    items = [
        ("Source quote", "Every decision, task, and risk stores the sentence that created it."),
        ("Owner resolution", "first-person · named · addressed · speaker-fallback · unassigned"),
        ("Due date source", "explicit phrase vs none — relative dates resolved against meeting date."),
        ("Agent trace", "Each specialist step is stored and visible on the Agents page."),
    ]
    for i, (h, b) in enumerate(items):
        y = Inches(1.6 + i * 1.15)
        card(s, Inches(0.7), y, Inches(12), Inches(1.02), WHITE)
        mark = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), y, Inches(0.12), Inches(1.02))
        fill_shape(mark, GOLD if i % 2 == 0 else EMERALD)
        add_text_box(s, Inches(1.1), y + Inches(0.12), Inches(11.2), Inches(0.4), h, 18, True, NAVY, font="Georgia")
        add_text_box(s, Inches(1.1), y + Inches(0.5), Inches(11.2), Inches(0.4), b, 15, False, MUTED)
    footer(s, 7, total)
    notes(
        s,
        "Open a task in the demo and read the quote. That is the viva moment. Regex maps a hit to a sentence. An LLM can hallucinate a task that was never said.",
    )

    # 8 Demo
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Live demo path — 4 minutes")
    steps = [
        ("1", "Overview", "Command center: tasks, risks, follow-ups already seeded."),
        ("2", "Process meeting", "Load Campus Nav App — Sprint Planning. Run agent pipeline."),
        ("3", "Watch the trace", "Orchestrator → Scribe → Decision → Action → Risk → Follow-up."),
        ("4", "Minutes", "Attendees, decisions, action table. Open one task quote."),
        ("5", "Board + inbox", "Tasks kanban, a risk, a follow-up draft (mailto / .ics)."),
        ("6", "Agents page", "Same trace stored. Export backup if asked about data."),
    ]
    for i, (n, h, b) in enumerate(steps):
        col, row = i % 3, i // 3
        x = Inches(0.7 + col * 4.15)
        y = Inches(1.65 + row * 2.4)
        card(s, x, y, Inches(3.95), Inches(2.2), WHITE)
        oval = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.25), y + Inches(0.28), Inches(0.42), Inches(0.42))
        fill_shape(oval, EMERALD)
        add_text_box(s, x + Inches(0.25), y + Inches(0.3), Inches(0.42), Inches(0.38), n, 14, True, WHITE, PP_ALIGN.CENTER)
        add_text_box(s, x + Inches(0.8), y + Inches(0.3), Inches(2.9), Inches(0.4), h, 18, True, NAVY, font="Georgia")
        add_text_box(s, x + Inches(0.25), y + Inches(0.95), Inches(3.45), Inches(1.0), b, 15, False, MUTED)
    footer(s, 8, total)
    notes(
        s,
        "Do this on YOUR laptop: npm run dev, then http://127.0.0.1:43127. Do not use the Cursor cloud localhost. Campus Nav is the canned demo — it always works without an API key.",
    )

    # 9 Audio
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Phone recording — what we do")
    left = [
        "People do not need to say their names in the audio.",
        "Upload MP3 / M4A / WAV under 25 MB.",
        "gpt-4o-transcribe-diarize → Speaker 1, Speaker 2.",
        "You rename speakers. We do not invent Karthik / Vaishnavi.",
        "Then the same six local agents run.",
    ]
    right = [
        "Paste a blob with no names → speaker Unknown.",
        "“I’ll finish the slides” stays unassigned. That is correct.",
        "Gemini recap bullets are notes, not speech.",
        "Needs OPENAI_API_KEY on the server.",
        "Without a key: paste + Campus Nav still work.",
    ]
    card(s, Inches(0.7), Inches(1.6), Inches(5.85), Inches(4.7), WHITE)
    add_text_box(s, Inches(0.95), Inches(1.8), Inches(5.4), Inches(0.45), "The intended path", 18, True, EMERALD, font="Georgia")
    bullet_block(s, Inches(0.95), Inches(2.4), Inches(5.4), Inches(3.6), left, 15)
    card(s, Inches(6.75), Inches(1.6), Inches(5.85), Inches(4.7), WHITE)
    add_text_box(s, Inches(7.0), Inches(1.8), Inches(5.4), Inches(0.45), "If the paste is unlabelled", 18, True, GOLD, font="Georgia")
    bullet_block(s, Inches(7.0), Inches(2.4), Inches(5.4), Inches(3.6), right, 15)
    footer(s, 9, total)
    notes(
        s,
        "Diarization tells us how many voices. Mapping Speaker 1 to a real name is a human step. Guessing names would be fabrication.",
    )

    # 10 Stack
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Stack and data")
    cells = [
        ("App", "Next.js 16 App Router, React 19, TypeScript"),
        ("UI", "Tailwind 4, shadcn/ui, Source Serif 4 headings"),
        ("Agents", "src/lib/agents/pipeline.ts — sequential local functions"),
        ("Data", "localStorage + JSON export/import. No login, no database."),
        ("Audio API", "POST /api/transcribe — key stays on the server"),
        ("Gap-fill API", "POST /api/refine — quote must be in the transcript"),
        ("Tests", "npm test — Campus Nav, fake Gemini attendees, quote check"),
        ("Run", "npm run dev → http://127.0.0.1:43127"),
    ]
    for i, (h, b) in enumerate(cells):
        col, row = i % 2, i // 2
        x = Inches(0.7 + col * 6.25)
        y = Inches(1.55 + row * 1.2)
        card(s, x, y, Inches(6.0), Inches(1.05), WHITE)
        add_text_box(s, x + Inches(0.25), y + Inches(0.12), Inches(5.5), Inches(0.35), h, 14, True, GOLD)
        add_text_box(s, x + Inches(0.25), y + Inches(0.48), Inches(5.5), Inches(0.45), b, 15, False, INK)
    footer(s, 10, total)
    notes(
        s,
        "No LangChain. No vector DB. No Three.js — feathers are CSS/SVG. If they ask about cloud: workspace is per-browser unless you export JSON.",
    )

    # 11 Evaluation
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "How we evaluate")
    metrics = [
        ("Minutes quality", "Does the MoM match topics, decisions, and quotes in the transcript?"),
        ("Task extraction", "Owners and dates vs spoken commitments. Campus Nav is the golden script."),
        ("Follow-up usefulness", "Recap + deadline check-in + open questions exist and are actionable drafts."),
        ("Explainability", "Source quote + owner/deadline provenance visible in the UI."),
        ("Determinism", "Same Campus Nav transcript always produces the same board."),
        ("Regression tests", "Nine golden tests: parse, pipeline, quote-checked gap fill, backup JSON."),
    ]
    for i, (h, b) in enumerate(metrics):
        y = Inches(1.5 + i * 0.8)
        nbox = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.7), y, Inches(0.55), Inches(0.55))
        fill_shape(nbox, EMERALD)
        nbox.adjustments[0] = 0.2
        add_text_box(s, Inches(0.7), y + Inches(0.08), Inches(0.55), Inches(0.4), str(i + 1), 16, True, WHITE, PP_ALIGN.CENTER)
        add_text_box(s, Inches(1.45), y, Inches(10.8), Inches(0.32), h, 16, True, NAVY)
        add_text_box(s, Inches(1.45), y + Inches(0.32), Inches(10.8), Inches(0.4), b, 14, False, MUTED)
    footer(s, 11, total)
    notes(
        s,
        "We do not claim BLEU/ROUGE. This is extraction with provenance. If they want F1, say: label a set of utterances next; the golden Campus Nav script is the current lock.",
    )

    # 12 Limits
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "Limitations — say these before they ask")
    limits = [
        "Cue-phrase extraction misses sarcasm, nods, and implicit “let’s do what we did last time.”",
        "Unlabelled dumps → Unknown attendees; first-person tasks stay unassigned.",
        "Follow-ups are drafts (mailto / copy / .ics). We do not send email or Slack.",
        "Workspace is this browser unless you export JSON. No multi-device sync.",
        "Audio needs a key and is capped at 25 MB. Overlapping speakers confuse diarization.",
        "English-oriented markers. Mixed Telugu/Hindi without cues needs the optional gap-fill.",
    ]
    bullet_block(s, Inches(0.7), Inches(1.6), Inches(12), Inches(4.0), limits, 17)
    add_text_box(
        s,
        Inches(0.7),
        Inches(5.7),
        Inches(12),
        Inches(0.9),
        "Next, if asked: a second-pass model only on unmatched sentences, still requiring a quote — not replacing the six-agent board with ChatGPT.",
        16,
        True,
        EMERALD,
    )
    footer(s, 12, total)
    notes(
        s,
        "Biggest weakness in one line: accountable and deterministic, but only extracts what the language makes explicit, does not notify anyone, and lives in one browser.",
    )

    # 13 Q&A cheat
    s = prs.slides.add_slide(blank)
    bg(s)
    title_bar(s, "If they interrupt")
    qa = [
        ("“Which LLM extracts tasks?”", "None. Local heuristics. Audio uses transcribe-diarize only to get the transcript."),
        ("“Why call them agents?”", "Single responsibility, typed hand-off, visible trace — architecture, not six foundation models."),
        ("“Why not RAG?”", "RAG searches a corpus. We extract from this meeting. Nothing to retrieve against."),
        ("“Isn’t this just regex?”", "Yes for extraction. The product is pipeline + typed workspace + provenance + human review."),
        ("“Did you fine-tune?”", "No."),
        ("“Does email go out?”", "No. Draft only. Mark sent after you actually send it."),
    ]
    for i, (q, a) in enumerate(qa):
        y = Inches(1.5 + i * 0.82)
        add_text_box(s, Inches(0.7), y, Inches(12), Inches(0.32), q, 15, True, NAVY)
        add_text_box(s, Inches(0.7), y + Inches(0.32), Inches(12), Inches(0.42), a, 14, False, MUTED)
    footer(s, 13, total)
    notes(s, "Keep answers short. Do not oversell. Honest beats impressive here.")

    # 14 Close
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    accent = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.18), H)
    fill_shape(accent, GOLD)
    add_text_box(s, Inches(0.9), Inches(2.0), Inches(11.5), Inches(0.4), "THANK YOU", 14, True, GOLD)
    add_text_box(s, Inches(0.9), Inches(2.5), Inches(11.5), Inches(1.2), "Questions", 54, True, WHITE, font="Georgia")
    add_text_box(
        s,
        Inches(0.9),
        Inches(4.0),
        Inches(11),
        Inches(1.1),
        "One model where the input is audio.\nRules where the output must be auditable.",
        22,
        False,
        CREAM,
        font="Georgia",
    )
    add_text_box(
        s,
        Inches(0.9),
        Inches(5.7),
        Inches(11),
        Inches(0.6),
        "Demo: Process meeting → Campus Nav App — Sprint Planning → Run agent pipeline",
        16,
        False,
        GOLD,
    )
    notes(
        s,
        "Stop. Offer to run Campus Nav live. If time: open one task and read the source quote.",
    )

    out = Path("/workspace/docs/MinuteMind-Agentic-AI-Presentation.pptx")
    out.parent.mkdir(parents=True, exist_ok=True)
    prs.save(out)
    artifact = Path("/opt/cursor/artifacts")
    if artifact.exists():
        prs.save(artifact / "MinuteMind-Agentic-AI-Presentation.pptx")
    print(out)
    return out


if __name__ == "__main__":
    build()
