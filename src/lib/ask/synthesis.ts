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

async function synthesizeAnthropic(apiKey: string, prompt: string): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Synthèse LLM : réponse vide");
  }
  return textBlock.text;
}

async function synthesizeOpenAI(apiKey: string, prompt: string): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Synthèse LLM : réponse vide");
  return text;
}

async function synthesizeGemini(apiKey: string, prompt: string): Promise<string> {
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

const PROVIDER_FN: Record<LlmProvider, (apiKey: string, prompt: string) => Promise<string>> = {
  anthropic: synthesizeAnthropic,
  openai: synthesizeOpenAI,
  gemini: synthesizeGemini,
};

/**
 * Synthesize a human-readable answer using the specified LLM provider.
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

  return Promise.race([
    PROVIDER_FN[provider](apiKey, prompt),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Synthèse LLM : timeout")),
        SYNTHESIS_TIMEOUT_MS,
      ),
    ),
  ]);
}
