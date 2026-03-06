import { NextRequest, NextResponse } from "next/server";
import { queryResourceData } from "@/lib/mcp/tools";
import { parseTabularData } from "@/lib/mcp/parsers";
import { synthesizeAnswer } from "@/lib/ask/synthesis";
import type { LlmProvider } from "@/types/ask";

const VALID_PROVIDERS: LlmProvider[] = ["anthropic", "openai", "gemini"];

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;

    const llmApiKey = request.headers.get("x-llm-api-key") || undefined;
    const body = await request.json();

    const {
      question = "Show all data",
      page = 1,
      page_size = 20,
      filter_column,
      filter_value,
      filter_operator,
      sort_column,
      sort_direction,
      llmProvider,
      resourceTitle,
      datasetTitle,
    } = body;

    if (page_size > 200) {
      return NextResponse.json(
        { error: "page_size doit être <= 200" },
        { status: 400 }
      );
    }

    const validProvider = VALID_PROVIDERS.includes(llmProvider) ? (llmProvider as LlmProvider) : undefined;

    const raw = await queryResourceData({
      question,
      resource_id: resourceId,
      page,
      page_size,
      filter_column,
      filter_value,
      filter_operator,
      sort_column,
      sort_direction,
    });

    const data = parseTabularData(raw);

    let synthesis: string | null = null;
    if (validProvider && llmApiKey && question !== "Show all data") {
      try {
        synthesis = await synthesizeAnswer(
          validProvider,
          llmApiKey,
          question,
          raw,
          data,
          {
            datasetTitle: datasetTitle || "Dataset",
            resourceTitle: resourceTitle || "Ressource",
          },
        );
      } catch (err) {
        console.error("[API] Synthesis error:", err instanceof Error ? err.message : "Unknown error");
      }
    }

    return NextResponse.json({ data, raw, synthesis });
  } catch (error) {
    console.error("[API] /resources/query error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Échec de la requête de données",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
