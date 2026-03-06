"use client";

import { useState } from "react";
import { MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLE_QUESTIONS = [
  "Population de Lyon",
  "Bornes recharge electrique",
  "Elections presidentielles 2022",
  "Liste des prenoms en France",
];

interface AskInputProps {
  onAsk: (question: string) => void;
  isLoading: boolean;
}

export function AskInput({ onAsk, isLoading }: AskInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onAsk(trimmed);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Posez une question sur les données françaises..."
          disabled={isLoading}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className="flex h-12 w-full rounded-lg border border-input bg-background pl-11 pr-12 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Poser une question"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || !value.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9"
          aria-label="Envoyer la question"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => {
              if (!isLoading) {
                setValue(q);
                onAsk(q);
              }
            }}
            disabled={isLoading}
            className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        Les réponses proviennent des données ouvertes de data.gouv.fr
      </p>
    </div>
  );
}
