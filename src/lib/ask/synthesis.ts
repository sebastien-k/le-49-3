import type { LlmProvider } from "@/types/ask";
import type { TabularData } from "@/types/dataset";

const MAX_COMPLETION_TOKENS = 512;
const SYNTHESIS_TIMEOUT_MS = 15_000;

/**
 * Build a compact data summary to minimize token usage.
 */
function buildDataSummary(
  rawAnswer: string,
  data: TabularData | null,
): string {
  const parts: string[] = [];

  const truncatedRaw =
    rawAnswer.length > 2000
      ? rawAnswer.slice(0, 2000) + "\n[...tronqué]"
      : rawAnswer;
  parts.push(`Réponse brute du serveur de données :\n${truncatedRaw}`);

  if (data && data.rows.length > 0) {
    const cols = data.columns.filter((c) => c !== "__id");
    parts.push(`\nDonnées tabulaires :`);
    parts.push(`- Colonnes : ${cols.join(", ")}`);
    parts.push(`- Nombre total de lignes : ${data.totalRows}`);
    parts.push(
      `- Aperçu (${Math.min(5, data.rows.length)} premières lignes) :`,
    );

    for (const row of data.rows.slice(0, 5)) {
      const values = cols.map((c) => `${c}: ${row[c] ?? ""}`).join(" | ");
      parts.push(`  ${values}`);
    }
  }

  return parts.join("\n");
}

/**
 * Build the synthesis prompt (shared across all providers).
 */
function buildPrompt(
  question: string,
  dataSummary: string,
  provenance: { datasetTitle: string; resourceTitle: string },
): string {
  return `Tu es un assistant spécialisé dans les données ouvertes françaises (data.gouv.fr).

L'utilisateur a posé la question suivante :
"${question}"

Voici les données extraites du dataset "${provenance.datasetTitle}" (ressource : "${provenance.resourceTitle}") :

${dataSummary}

Instructions :
- Réponds en français avec cette structure :
  1. **Titre** : une phrase-réponse directe en gras (ex: "**La France compte 34 965 communes.**")
  2. **Détails** : 2-3 bullet points avec les chiffres clés (utilise "- ")
  3. **Avertissement** (si nécessaire) : une ligne commençant par "⚠️" si les données ne répondent pas complètement à la question
- Ne mentionne PAS les détails techniques (API, resource ID, page, etc.).
- Ne mentionne PAS la source (elle est déjà affichée séparément).
- Sois concis : 5 lignes maximum au total.`;
}

// --- Provider-specific synthesis functions ---

async function synthesizeAnthropic(apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: [{ role: "user", content: prompt }],
  }, { signal });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Synthèse LLM : réponse vide");
  }
  return textBlock.text;
}

async function synthesizeOpenAI(apiKey: string, prompt: string, signal?: AbortSignal): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: [{ role: "user", content: prompt }],
  }, { signal });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Synthèse LLM : réponse vide");
  return text;
}

async function synthesizeGemini(apiKey: string, prompt: string, _signal?: AbortSignal): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { maxOutputTokens: MAX_COMPLETION_TOKENS },
  });

  const text = response.text;
  if (!text) throw new Error("Synthèse LLM : réponse vide");
  return text;
}

// --- Dispatcher ---

type ProviderFn = (apiKey: string, prompt: string, signal?: AbortSignal) => Promise<string>;

const PROVIDER_FN: Record<LlmProvider, ProviderFn> = {
  anthropic: synthesizeAnthropic,
  openai: synthesizeOpenAI,
  gemini: synthesizeGemini,
};

/**
 * Synthesize a human-readable answer using the specified LLM provider.
 * Uses AbortController to cancel the underlying HTTP request on timeout.
 */
export async function synthesizeAnswer(
  provider: LlmProvider,
  apiKey: string,
  question: string,
  rawAnswer: string,
  data: TabularData | null,
  provenance: { datasetTitle: string; resourceTitle: string },
): Promise<string> {
  const dataSummary = buildDataSummary(rawAnswer, data);
  const prompt = buildPrompt(question, dataSummary, provenance);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error("Synthèse LLM : timeout")),
    SYNTHESIS_TIMEOUT_MS,
  );

  try {
    return await PROVIDER_FN[provider](apiKey, prompt, controller.signal);
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new Error("Synthèse LLM : timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
