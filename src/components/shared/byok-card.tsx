"use client";

import { useState, useEffect } from "react";
import { Key, ChevronDown, ChevronUp, X, Check, ExternalLink } from "lucide-react";
import { PROVIDERS, getActiveProviderFromStorage } from "@/lib/llm/providers";
import type { LlmProvider } from "@/types/ask";

export function ByokCard() {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [activeTab, setActiveTab] = useState<LlmProvider>("anthropic");
  const [keys, setKeys] = useState<Record<LlmProvider, string>>({
    anthropic: "",
    openai: "",
    gemini: "",
  });

  useEffect(() => {
    const loaded: Record<LlmProvider, string> = { anthropic: "", openai: "", gemini: "" };
    let firstConfigured: LlmProvider | null = null;
    for (const p of PROVIDERS) {
      const stored = localStorage.getItem(p.storageKey);
      if (stored) {
        loaded[p.id] = stored;
        if (!firstConfigured) firstConfigured = p.id;
      }
    }
    setKeys(loaded);
    if (firstConfigured) setActiveTab(firstConfigured);
  }, []);

  const handleSaveKey = (provider: LlmProvider, key: string) => {
    setKeys((prev) => ({ ...prev, [provider]: key }));
    const config = PROVIDERS.find((p) => p.id === provider)!;
    if (key) {
      localStorage.setItem(config.storageKey, key);
    } else {
      localStorage.removeItem(config.storageKey);
    }
  };

  const activeProvider = getActiveProviderFromStorage();
  const hasAnyKey = Object.values(keys).some(Boolean);
  const currentTab = PROVIDERS.find((p) => p.id === activeTab)!;

  return (
    <div id="byok-card" className={`max-w-md mx-auto rounded-lg border px-4 py-3 transition-colors ${
      hasAnyKey
        ? "border-green-500/20 bg-green-50 dark:bg-green-950/20"
        : "border-amber-500/20 bg-amber-50 dark:bg-amber-950/20"
    }`}>
      <div className="text-center">
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
            hasAnyKey
              ? "border-green-600/30 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50"
              : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          {hasAnyKey ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
          {hasAnyKey
            ? `Synthèse via ${activeProvider?.config.model}`
            : "Activer la synthèse IA (clé API)"}
          {showKeyInput ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {showKeyInput && (
        <div className="mt-3">
          <div className="flex gap-1 rounded-md bg-muted/50 p-0.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === p.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
                {keys[p.id] && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <input
              type="password"
              value={keys[activeTab]}
              onChange={(e) => handleSaveKey(activeTab, e.target.value)}
              placeholder={currentTab.placeholder}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Clé API ${currentTab.label}`}
            />
            {keys[activeTab] && (
              <button
                onClick={() => handleSaveKey(activeTab, "")}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Supprimer la clé"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
            {currentTab.instructions}{" "}
            <a
              href={currentTab.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              {currentTab.consoleLabel}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>

          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Votre clé est stockée uniquement dans votre navigateur. Modèle : {currentTab.model}.
          </p>
        </div>
      )}

      {!hasAnyKey && !showKeyInput && (
        <p className="text-xs text-amber-800 dark:text-amber-300 mt-2 text-center leading-relaxed">
          Une clé API (Anthropic, OpenAI ou Gemini) permet d&apos;obtenir de meilleurs résultats.
        </p>
      )}
    </div>
  );
}
