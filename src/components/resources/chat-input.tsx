"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Combien de lignes au total ?",
  "Quelles colonnes ?",
  "Top 5",
];

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-3 space-y-2">
      {/* Quick suggestions */}
      <div className="flex gap-1.5 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              if (!disabled) onSend(s);
            }}
            disabled={disabled}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question sur ces données..."
          disabled={disabled}
          rows={1}
          className="min-h-[38px] max-h-[80px] resize-none text-sm"
          aria-label="Question sur les données"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="h-9 w-9 shrink-0"
          aria-label="Envoyer la question"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[0.65rem] text-muted-foreground/60 text-center">
        Les questions sont envoyées au MCP data.gouv.fr
      </p>
    </div>
  );
}
