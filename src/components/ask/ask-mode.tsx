"use client";

import { useAsk } from "@/hooks/use-ask";
import { AskInput } from "./ask-input";
import { AskStepper } from "./ask-stepper";
import { AskResult } from "./ask-result";
import { ErrorDisplay } from "@/components/shared/error-display";

export function AskMode() {
  const { status, question, steps, result, error, ask, reset } = useAsk();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AskInput onAsk={ask} isLoading={status === "loading"} />

      {/* Stepper */}
      {status !== "idle" && (
        <AskStepper steps={steps} collapsible={status === "done"} />
      )}

      {/* Erreur */}
      {status === "error" && error && (
        <ErrorDisplay message={error} onRetry={() => ask(question)} />
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
