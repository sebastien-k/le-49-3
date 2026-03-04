"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage } from "@/types/chat";

const COLLAPSE_THRESHOLD = 200;

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);

  if (message.isLoading) {
    return (
      <div className="self-start rounded-xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.2s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="self-end max-w-[85%] rounded-xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
        {message.content}
      </div>
    );
  }

  // Assistant message
  const isLong = message.content.length > COLLAPSE_THRESHOLD;
  const displayText =
    isLong && !expanded
      ? message.content.slice(0, COLLAPSE_THRESHOLD) + "..."
      : message.content;

  return (
    <div className="self-start rounded-xl rounded-bl-sm bg-muted px-4 py-3 space-y-2">
      {message.error ? (
        <div className="flex items-start gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{message.error}</span>
        </div>
      ) : (
        <>
          {message.content && (
            <div className="text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed break-all">
                {displayText}
              </pre>
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Réduire
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Voir tout
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {message.data && message.data.rows.length > 0 && (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    {message.data.columns
                      .filter((c) => c !== "__id")
                      .slice(0, 5)
                      .map((col) => (
                        <th
                          key={col}
                          className="px-2 py-1 text-left font-medium whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {message.data.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      {message.data!.columns
                        .filter((c) => c !== "__id")
                        .slice(0, 5)
                        .map((col) => (
                          <td
                            key={col}
                            className="px-2 py-1 max-w-[120px] truncate whitespace-nowrap"
                            title={row[col]}
                          >
                            {row[col]}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {message.data.totalRows > 5 && (
                <div className="text-xs text-muted-foreground px-2 py-1 border-t">
                  {message.data.totalRows} lignes au total
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
