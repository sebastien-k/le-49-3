import type { LlmProvider } from "@/types/ask";

export interface ProviderConfig {
  id: LlmProvider;
  label: string;
  model: string;
  placeholder: string;
  consoleUrl: string;
  consoleLabel: string;
  storageKey: string;
  instructions: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    model: "Claude Haiku",
    placeholder: "sk-ant-...",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    consoleLabel: "console.anthropic.com",
    storageKey: "le-49-3-anthropic-key",
    instructions:
      "Créez un compte sur console.anthropic.com, puis générez une clé API dans Settings → API Keys.",
  },
  {
    id: "openai",
    label: "OpenAI",
    model: "GPT-4o mini",
    placeholder: "sk-...",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "platform.openai.com",
    storageKey: "le-49-3-openai-key",
    instructions:
      "Créez un compte sur platform.openai.com, puis générez une clé API dans API Keys.",
  },
  {
    id: "gemini",
    label: "Gemini",
    model: "Gemini 2.5 Flash",
    placeholder: "AI...",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleLabel: "aistudio.google.com",
    storageKey: "le-49-3-gemini-key",
    instructions:
      "Rendez-vous sur AI Studio et cliquez sur « Create API Key ».",
  },
];

/**
 * Read the active provider and its key from localStorage.
 * Returns the first provider with a stored key (in tab order).
 */
export function getActiveProviderFromStorage(): {
  provider: LlmProvider;
  apiKey: string;
  config: ProviderConfig;
} | null {
  if (typeof window === "undefined") return null;

  for (const p of PROVIDERS) {
    const key = localStorage.getItem(p.storageKey);
    if (key) return { provider: p.id, apiKey: key, config: p };
  }

  return null;
}
