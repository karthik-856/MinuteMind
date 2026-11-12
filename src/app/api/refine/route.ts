import { REFINE_MODEL, requestGapFill } from "@/lib/agents/refine-model";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return Response.json({
    available: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: REFINE_MODEL,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Gap fill needs OPENAI_API_KEY on the server. The local pipeline still works without it.",
      },
      { status: 503 },
    );
  }

  let body: {
    transcript?: string;
    coveredQuotes?: string[];
    refineSummary?: boolean;
    existingSummary?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Expected JSON with a transcript." }, { status: 400 });
  }

  const transcript = body.transcript?.trim() ?? "";
  if (transcript.length < 40) {
    return Response.json({ error: "Transcript is too short to refine." }, { status: 400 });
  }

  try {
    const result = await requestGapFill({
      apiKey,
      transcript,
      coveredQuotes: body.coveredQuotes ?? [],
      refineSummary: body.refineSummary,
      existingSummary: body.existingSummary,
    });
    return Response.json({ model: REFINE_MODEL, ...result });
  } catch {
    return Response.json({ error: "Could not reach the refinement model." }, { status: 502 });
  }
}
