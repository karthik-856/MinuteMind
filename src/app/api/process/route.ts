import {
  applyValidatedGaps,
  coveredQuotesFrom,
  validateGapProposals,
} from "@/lib/agents/gaps";
import { runPipeline } from "@/lib/agents/pipeline";
import { requestGapFill } from "@/lib/agents/refine-model";
import type { ProcessInput } from "@/lib/types";

export async function POST(request: Request) {
  let body: ProcessInput & { fillGaps?: boolean };
  try {
    body = (await request.json()) as ProcessInput & { fillGaps?: boolean };
  } catch {
    return Response.json({ error: "Expected JSON with title, date, and transcript." }, { status: 400 });
  }

  if (!body?.transcript || !body?.date) {
    return Response.json({ error: "transcript and date are required." }, { status: 400 });
  }

  let result = await runPipeline(
    {
      title: body.title || "Untitled meeting",
      date: body.date,
      durationMinutes: body.durationMinutes,
      transcript: body.transcript,
      source: body.source ?? "paste",
      meetingId: body.meetingId,
      createdAt: body.createdAt,
    },
    undefined,
    { delayMs: 0 },
  );

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (body.fillGaps && apiKey) {
    try {
      const payload = await requestGapFill({
        apiKey,
        transcript: body.transcript,
        coveredQuotes: coveredQuotesFrom(result),
        refineSummary: true,
        existingSummary: result.meeting.minutes?.executiveSummary,
      });
      const gaps = validateGapProposals(
        payload.proposals,
        body.transcript,
        coveredQuotesFrom(result),
        result.meeting,
        new Date().toISOString(),
      );
      gaps.executiveSummary = payload.executiveSummary;
      result = applyValidatedGaps(result, gaps, new Date().toISOString()).result;
    } catch {
      // Keep the local pipeline result if refinement fails.
    }
  }

  return Response.json(result);
}
