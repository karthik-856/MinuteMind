import { quoteInTranscript, type GapProposal } from "@/lib/agents/gaps";

export const REFINE_MODEL = "gpt-4o-mini";

export async function requestGapFill(options: {
  apiKey: string;
  transcript: string;
  coveredQuotes: string[];
  refineSummary?: boolean;
  existingSummary?: string;
}): Promise<{ proposals: GapProposal[]; executiveSummary?: string }> {
  const excerpt = options.transcript.slice(0, 8000);
  const covered = options.coveredQuotes.filter(Boolean).slice(0, 80);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: REFINE_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You only extract meeting commitments the first pass missed. Return JSON: {\"proposals\":[{\"kind\":\"decision|task|risk|question\",\"text\":\"short item\",\"quote\":\"verbatim substring from the transcript\",\"owner\":\"optional attendee name\"}],\"executiveSummary\":\"optional 3-5 sentences\"}. Every quote MUST be copied verbatim from the transcript. Do not invent names, dates, or work. If nothing was missed, return {\"proposals\":[]}.",
        },
        {
          role: "user",
          content: `Already extracted quotes (do not repeat):\n${covered.join("\n") || "(none)"}\n\n${
            options.refineSummary && options.existingSummary
              ? `Existing summary:\n${options.existingSummary}\n\n`
              : ""
          }Transcript:\n${excerpt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("The refinement model request failed.");
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const parsed = parseModelJson(json.choices?.[0]?.message?.content ?? "");
  const proposals = (parsed.proposals ?? []).filter((item): item is GapProposal => {
    if (!item || typeof item.quote !== "string" || typeof item.text !== "string") return false;
    if (!["decision", "task", "risk", "question"].includes(item.kind)) return false;
    return quoteInTranscript(item.quote, options.transcript);
  });

  const executiveSummary =
    options.refineSummary && typeof parsed.executiveSummary === "string"
      ? parsed.executiveSummary.trim()
      : undefined;

  return { proposals, executiveSummary: executiveSummary || undefined };
}

function parseModelJson(content: string): {
  proposals?: GapProposal[];
  executiveSummary?: string;
} {
  try {
    return JSON.parse(content) as { proposals?: GapProposal[]; executiveSummary?: string };
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as { proposals?: GapProposal[]; executiveSummary?: string };
    } catch {
      return {};
    }
  }
}
