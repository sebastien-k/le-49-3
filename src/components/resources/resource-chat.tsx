"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Sparkles, Trash2, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import { useResourceChat } from "@/hooks/use-resource-chat";
import { getActiveProviderFromStorage, type ProviderConfig } from "@/lib/llm/providers";

interface ResourceChatProps {
  resourceId: string;
  resourceTitle?: string;
  datasetTitle?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export function ResourceChat({ resourceId, resourceTitle, datasetTitle, isExpanded, onToggleExpand, onClose }: ResourceChatProps) {
  const { messages, isLoading, sendMessage, clearHistory } =
    useResourceChat(resourceId, resourceTitle, datasetTitle);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderConfig | null>(null);

  useEffect(() => {
    const active = getActiveProviderFromStorage();
    setActiveProvider(active?.config ?? null);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Interroger les données</h3>
          {activeProvider ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-600/30 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
              <Sparkles className="h-2.5 w-2.5" />
              {activeProvider.model}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              Synthèse IA non activée
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={clearHistory}
              title="Effacer l'historique"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Fermer le chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" role="log" aria-live="polite">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Posez une question sur les données
              </p>
              <p className="text-xs text-muted-foreground/60">
                Ex: &quot;Quel département a la plus grande population ?&quot;
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
