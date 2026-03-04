"use client";

import { useEffect, useRef } from "react";
import { MessageSquare, Trash2, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatInput } from "./chat-input";
import { useResourceChat } from "@/hooks/use-resource-chat";

interface ResourceChatProps {
  resourceId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export function ResourceChat({ resourceId, isExpanded, onToggleExpand, onClose }: ResourceChatProps) {
  const { messages, isLoading, sendMessage, clearHistory } =
    useResourceChat(resourceId);
  const bottomRef = useRef<HTMLDivElement>(null);

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
