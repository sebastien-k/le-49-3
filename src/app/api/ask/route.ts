import { NextRequest } from "next/server";
import { runAskPipeline } from "@/lib/ask/pipeline";
import { humanizeError } from "@/lib/mcp/errors";
import type { AskEvent, LlmProvider } from "@/types/ask";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { question?: string; llmProvider?: LlmProvider; llmApiKey?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corps de requête invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const question = body.question?.trim();
  if (!question || question.length < 3) {
    return new Response(
      JSON.stringify({ error: "La question doit contenir au moins 3 caractères" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (question.length > 500) {
    return new Response(
      JSON.stringify({ error: "La question ne doit pas dépasser 500 caractères" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AskEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream already closed (client disconnected)
        }
      };

      try {
        await runAskPipeline(question, emit, body.llmProvider, body.llmApiKey || undefined);
      } catch (err) {
        emit({
          type: "error",
          step: "unknown",
          message: humanizeError(err instanceof Error ? err.message : "Erreur interne du serveur"),
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
