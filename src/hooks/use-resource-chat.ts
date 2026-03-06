"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { getActiveProviderFromStorage } from "@/lib/llm/providers";

const MAX_MESSAGES = 30;

export function useResourceChat(
  resourceId: string,
  resourceTitle?: string,
  datasetTitle?: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isLoading) return;

      // Abort previous request if any
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantId = crypto.randomUUID();
      const loadingMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => {
        const next = [...prev, userMsg, loadingMsg];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
      setIsLoading(true);

      try {
        const active = getActiveProviderFromStorage();

        const res = await fetch(`/api/resources/${resourceId}/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(active?.apiKey ? { "X-Llm-Api-Key": active.apiKey } : {}),
          },
          body: JSON.stringify({
            question: trimmed,
            page: 1,
            page_size: 20,
            llmProvider: active?.provider,
            resourceTitle,
            datasetTitle,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const result = await res.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: result.raw || "Aucune réponse.",
                  synthesis: result.synthesis || undefined,
                  data: result.data || undefined,
                  isLoading: false,
                }
              : msg
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: "",
                  isLoading: false,
                  error:
                    err instanceof Error ? err.message : "Erreur inconnue",
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [resourceId, resourceTitle, datasetTitle, isLoading]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearHistory };
}
