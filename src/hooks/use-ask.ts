"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AskState, AskStep, AskEvent, AskResultEvent, AskStepId, AskStepStatus, AskStepLink, LlmProvider } from "@/types/ask";

const INITIAL_STEPS: AskStep[] = [
  { id: "keywords", label: "Extraction des mots-clés", status: "pending" },
  { id: "search", label: "Recherche de datasets", status: "pending" },
  { id: "resources", label: "Exploration des ressources", status: "pending" },
  { id: "tabular-check", label: "Vérification API Tabulaire", status: "pending" },
  { id: "query", label: "Interrogation des données", status: "pending" },
  { id: "synthesis", label: "Synthèse de la réponse", status: "pending" },
];

const INITIAL_STATE: AskState = {
  status: "idle",
  question: "",
  steps: [],
  result: null,
  error: null,
};

function updateStep(
  steps: AskStep[],
  stepId: AskStepId,
  status: AskStepStatus,
  label?: string,
  detail?: string,
  links?: AskStepLink[],
  aiEnhanced?: string,
): AskStep[] {
  return steps.map((s) =>
    s.id === stepId
      ? { ...s, status, ...(label && { label }), ...(detail !== undefined && { detail }), ...(links && { links }), ...(aiEnhanced !== undefined && { aiEnhanced }) }
      : s,
  );
}

export function useAsk() {
  const [state, setState] = useState<AskState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (question: string, llmProvider?: LlmProvider, llmApiKey?: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      status: "loading",
      question: trimmed,
      steps: INITIAL_STEPS.map((s) => ({ ...s })),
      result: null,
      error: null,
    });

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, llmProvider, llmApiKey }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Pas de stream dans la réponse");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer (split on double newline)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const event: AskEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case "step":
                setState((prev) => ({
                  ...prev,
                  steps: updateStep(prev.steps, event.step, event.status, event.label, event.detail, event.links, event.aiEnhanced),
                }));
                break;

              case "result":
                setState((prev) => ({
                  ...prev,
                  status: "done",
                  result: event as AskResultEvent,
                }));
                break;

              case "info":
                setState((prev) => ({
                  ...prev,
                  status: "info",
                  error: event.message,
                  steps: event.step !== "unknown"
                    ? updateStep(prev.steps, event.step as AskStepId, "error")
                    : prev.steps,
                }));
                break;

              case "error":
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  error: event.message,
                  steps: event.step !== "unknown"
                    ? updateStep(prev.steps, event.step as AskStepId, "error")
                    : prev.steps,
                }));
                break;
            }
          } catch {
            // Invalid JSON line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Erreur inconnue",
      }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { ...state, ask, reset };
}
