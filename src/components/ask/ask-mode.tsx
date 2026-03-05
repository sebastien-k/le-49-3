"use client";

import { Info } from "lucide-react";
import { useAsk } from "@/hooks/use-ask";
import { AskInput } from "./ask-input";
import { AskStepper } from "./ask-stepper";
import { AskResult } from "./ask-result";
import { ErrorDisplay } from "@/components/shared/error-display";
import { getActiveProviderFromStorage } from "@/lib/llm/providers";

export function AskMode() {
  const { status, question, steps, result, error, ask, reset } = useAsk();

  const handleAsk = (q: string) => {
    const active = getActiveProviderFromStorage();
    ask(q, active?.provider, active?.apiKey);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AskInput onAsk={handleAsk} isLoading={status === "loading"} />

      {/* Stepper */}
      {status !== "idle" && (
        <AskStepper steps={steps} collapsible={status === "done" || status === "info"} />
      )}

      {/* Info (pas de données interrogeables) */}
      {status === "info" && error && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Info className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
      )}

      {/* Erreur */}
      {status === "error" && error && (
        <ErrorDisplay message={error} onRetry={() => handleAsk(question)} />
      )}

      {/* Résultat */}
      {status === "done" && result && <AskResult result={result} />}

      {/* Reset */}
      {status !== "idle" && status !== "loading" && (
        <div className="text-center">
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Poser une autre question
          </button>
        </div>
      )}
    </div>
  );
}
