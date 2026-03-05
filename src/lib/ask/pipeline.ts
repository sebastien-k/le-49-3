import {
  searchDatasets,
  listDatasetResources,
  getResourceInfo,
  queryResourceData,
} from "@/lib/mcp/tools";
import {
  parseSearchDatasets,
  parseResourceList,
  parseResourceInfo,
  parseTabularData,
} from "@/lib/mcp/parsers";
import { synthesizeAnswer } from "@/lib/ask/synthesis";
import type { AskEvent, AskProvenance, LlmProvider } from "@/types/ask";
import { humanizeError } from "@/lib/mcp/errors";
import type { Resource } from "@/types/dataset";

// --- Constantes ---

const MCP_TIMEOUT_MS = 30_000;
const MAX_DATASETS = 5;
const MAX_SEARCH_RESULTS = 5;
const MIN_ROWS_THRESHOLD = 50; // Below this, try next resource if available

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms / 1000}s) : ${label}`)), ms),
    ),
  ]);
}

// --- Stop words français (normalisés sans accents) ---

const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "d",
  "en", "et", "est", "a", "au", "aux", "ce", "ces", "qui",
  "que", "quel", "quelle", "quels", "quelles", "quoi",
  "dans", "par", "pour", "sur", "avec", "sans", "son", "sa",
  "ses", "leur", "leurs", "mon", "ma", "mes", "ton", "ta", "tes",
  "il", "elle", "ils", "elles", "on", "nous", "vous", "je", "tu",
  "y", "ne", "pas", "plus", "se", "si", "ou", "mais",
  "combien", "comment", "pourquoi", "quand",
  "ont", "sont", "fait", "peut", "cette", "cet",
  "tous", "tout", "toute", "toutes", "tres", "bien",
  "aussi", "etre", "avoir", "faire", "france", "francais",
  "francaise", "nombre", "liste", "total",
  "donnees", "ouvertes", "ouverts", "statistiques", "statistique",
  "information", "informations", "nationale", "nationaux",
]);

const TABULAR_FORMATS = new Set(["csv", "tsv", "xls", "xlsx"]);

function sanitizeQuestion(question: string): string {
  return question.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim();
}

export function extractKeywords(question: string): string[] {
  const words = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  return [...new Set(words)].slice(0, 3);
}

// --- Extraction de mots-clés via LLM (avec fallback mécanique) ---

const KW_LLM_TIMEOUT_MS = 8_000;
const KW_MAX_TOKENS = 50;

const KW_PROMPT = (q: string) =>
  `Extrais 1 à 3 mots-clés de recherche pour trouver un dataset sur data.gouv.fr.
Règles :
- Garde UNIQUEMENT le sujet concret (ex: "offices de tourisme", "hôpitaux", "population")
- JAMAIS de termes génériques : données, ouvertes, france, français, statistiques, information, nombre, liste, total
- Corrige les fautes. Utilise les termes officiels.
- Réponds UNIQUEMENT avec les mots-clés séparés par des virgules.

Question : "${q}"`;

async function extractKeywordsWithLlm(
  question: string,
  provider: LlmProvider,
  apiKey: string,
): Promise<string[]> {
  const prompt = KW_PROMPT(question);

  let text: string;
  switch (provider) {
    case "anthropic": {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: KW_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content.find((b) => b.type === "text");
      text = block?.type === "text" ? block.text : "";
      break;
    }
    case "openai": {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: KW_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      });
      text = completion.choices[0]?.message?.content || "";
      break;
    }
    case "gemini": {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { maxOutputTokens: KW_MAX_TOKENS },
      });
      text = response.text || "";
      break;
    }
    default:
      throw new Error(`Provider LLM non reconnu : ${provider}`);
  }

  const keywords = text
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 1 && k.length < 30)
    .filter((k) => {
      // Remove keywords that are entirely stop words (e.g. "données ouvertes", "france")
      const words = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
      return words.some((w) => w.length > 2 && !STOP_WORDS.has(w));
    });

  if (keywords.length === 0) throw new Error("LLM returned no keywords");
  return keywords.slice(0, 3);
}

type ResourceCandidate = Resource & { datasetId: string; datasetTitle: string };

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function scoreResource(candidate: ResourceCandidate, keywords: string[], question: string): number {
  let score = 0;
  const title = normalizeText(candidate.title || "");
  const datasetTitle = normalizeText(candidate.datasetTitle || "");
  const desc = normalizeText(candidate.description || "");
  const questionWords = normalizeText(question).split(/\s+/).filter(w => w.length > 2);
  const normalizedKeywords = keywords.map(normalizeText);

  for (const kw of normalizedKeywords) {
    if (title.includes(kw)) score += 10;
    if (datasetTitle.includes(kw)) score += 5;
    if (desc.includes(kw)) score += 3;

    // Big bonus: dataset title IS the keyword (e.g. "Communes" for query "communes")
    // This favors official/canonical datasets over regional subsets
    const dtWords = datasetTitle.split(/\s+/).filter(w => w.length > 2);
    if (dtWords.length <= 3 && datasetTitle.includes(kw)) score += 15;
  }

  // Bonus format CSV (plus fiable que XLS)
  if ((candidate.format || "").toLowerCase() === "csv") score += 3;
  // Bonus type "main"
  if ((candidate.resourceType || "").toLowerCase() === "main") score += 2;

  // Mots de la question dans le titre de la ressource
  for (const word of questionWords) {
    if (title.includes(word)) score += 2;
  }

  return score;
}

export async function runAskPipeline(
  question: string,
  emit: (event: AskEvent) => void,
  llmProvider?: LlmProvider,
  llmApiKey?: string,
): Promise<void> {
  // Sanitize input
  question = sanitizeQuestion(question);

  // --- Étape 1 : Extraction mots-clés ---
  emit({ type: "step", step: "keywords", status: "active", label: "Extraction des mots-clés..." });

  let keywords: string[];
  let usedLlm = false;

  if (llmProvider && llmApiKey) {
    try {
      keywords = await withTimeout(
        extractKeywordsWithLlm(question, llmProvider, llmApiKey),
        KW_LLM_TIMEOUT_MS,
        "extractKeywordsWithLlm",
      );
      usedLlm = true;
    } catch {
      // Fallback silencieux vers extraction mécanique
      keywords = extractKeywords(question);
    }
  } else {
    keywords = extractKeywords(question);
  }

  if (keywords.length === 0) {
    emit({ type: "step", step: "keywords", status: "error", label: "Aucun mot-clé extrait" });
    emit({
      type: "info",
      step: "keywords",
      message: "Impossible d'extraire des mots-clés de la question. Essayez une question plus précise.",
    });
    return;
  }

  const keywordQuery = keywords.join(" ");
  emit({
    type: "step",
    step: "keywords",
    status: "done",
    label: "Mots-clés extraits",
    detail: keywords.join(", "),
    ...(usedLlm
      ? { aiEnhanced: "Extraction optimisée par IA — correction des fautes et termes officiels" }
      : { aiMissing: "Avec une clé API, l'IA corrigerait les fautes et utiliserait les termes officiels" }),
  });

  // --- Étape 2 : Recherche datasets ---
  emit({ type: "step", step: "search", status: "active", label: "Recherche de datasets..." });

  let datasetIds: { id: string; title: string }[];
  try {
    const raw = await withTimeout(
      searchDatasets({ query: keywordQuery, page_size: MAX_SEARCH_RESULTS }),
      MCP_TIMEOUT_MS,
      "search_datasets",
    );
    const { datasets } = parseSearchDatasets(raw);

    if (datasets.length === 0) {
      emit({ type: "step", step: "search", status: "error", label: "Aucun dataset trouvé" });
      emit({
        type: "info",
        step: "search",
        message: `Aucun dataset trouvé pour "${keywordQuery}". Essayez de reformuler votre question.`,
      });
      return;
    }

    datasetIds = datasets.slice(0, MAX_DATASETS).map((d) => ({ id: d.id, title: d.title }));
    emit({
      type: "step",
      step: "search",
      status: "done",
      label: `${datasets.length} dataset(s) trouvé(s)`,
      detail: datasetIds.map((d) => d.title).join(", "),
      links: datasetIds.map((d) => ({ label: d.title, href: `/datasets/${d.id}` })),
    });
  } catch (err) {
    emit({ type: "step", step: "search", status: "error", label: "Erreur de recherche" });
    emit({ type: "error", step: "search", message: humanizeError(err instanceof Error ? err.message : "Erreur inconnue") });
    return;
  }

  // --- Étape 3 : Lister les ressources (parallèle, max 3 datasets) ---
  emit({ type: "step", step: "resources", status: "active", label: "Exploration des ressources..." });

  let candidates: ResourceCandidate[] = [];

  try {
    const results = await Promise.allSettled(
      datasetIds.map(async (ds) => {
        const raw = await withTimeout(
          listDatasetResources({ dataset_id: ds.id }),
          MCP_TIMEOUT_MS,
          `list_resources(${ds.id})`,
        );
        const resources = parseResourceList(raw);
        return resources.map((r) => ({ ...r, datasetId: ds.id, datasetTitle: ds.title }));
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        candidates.push(...result.value);
      }
    }

    // Filtrer les formats tabulaires
    const tabularCandidates = candidates.filter((r) =>
      TABULAR_FORMATS.has((r.format || "").toLowerCase()),
    );

    if (tabularCandidates.length === 0) {
      emit({
        type: "step",
        step: "resources",
        status: "error",
        label: "Aucune ressource tabulaire",
      });
      emit({
        type: "info",
        step: "resources",
        message: "Aucune ressource CSV/XLS trouvée dans les datasets. Les données ne sont pas interrogeables directement.",
      });
      return;
    }

    candidates = tabularCandidates;
    emit({
      type: "step",
      step: "resources",
      status: "done",
      label: `${candidates.length} ressource(s) tabulaire(s)`,
      detail: candidates.slice(0, 3).map((r) => `${r.title} (${r.format})`).join(", "),
      links: candidates.slice(0, 3).map((r) => ({
        label: `${r.title} (${r.format})`,
        href: `/datasets/${r.datasetId}/resources/${r.id}`,
      })),
    });
  } catch (err) {
    emit({ type: "step", step: "resources", status: "error", label: "Erreur d'exploration" });
    emit({ type: "error", step: "resources", message: humanizeError(err instanceof Error ? err.message : "Erreur inconnue") });
    return;
  }

  // --- Étape 4 : Vérifier l'API Tabulaire ---
  emit({ type: "step", step: "tabular-check", status: "active", label: "Vérification de l'API Tabulaire..." });

  let chosenResource: ResourceCandidate | null = null;
  const checkErrors: string[] = [];
  const confirmedTabular: ResourceCandidate[] = [];

  // Sort candidates by relevance score before checking API
  const scoredCandidates = candidates
    .map((c) => ({ candidate: c, score: scoreResource(c, keywords, question) }))
    .sort((a, b) => b.score - a.score);

  for (const { candidate } of scoredCandidates) {
    try {
      const raw = await withTimeout(
        getResourceInfo({ resource_id: candidate.id }),
        MCP_TIMEOUT_MS,
        `get_resource_info(${candidate.id})`,
      );
      const info = parseResourceInfo(raw);
      if (info?.isTabular) {
        confirmedTabular.push({ ...candidate, isTabular: true });
      }
    } catch (err) {
      checkErrors.push(`${candidate.title}: ${err instanceof Error ? err.message : "erreur"}`);
    }
  }

  if (confirmedTabular.length > 0) {
    // First element is already the best — candidates were pre-sorted by score
    chosenResource = confirmedTabular[0];
  }

  if (!chosenResource) {
    emit({
      type: "step",
      step: "tabular-check",
      status: "error",
      label: "Aucune ressource compatible",
    });
    emit({
      type: checkErrors.length > 0 ? "error" : "info",
      step: "tabular-check",
      message: checkErrors.length > 0
        ? `Aucune ressource compatible (${checkErrors.length} erreur(s) : ${checkErrors[0]})`
        : "Aucune ressource n'est disponible via l'API Tabulaire. Les données ne sont pas interrogeables directement.",
    });
    return;
  }

  emit({
    type: "step",
    step: "tabular-check",
    status: "done",
    label: `${confirmedTabular.length} ressource(s) compatible(s)`,
    detail: `${chosenResource.title} (${chosenResource.format})`,
    links: [{
      label: `${chosenResource.title} (${chosenResource.format})`,
      href: `/datasets/${chosenResource.datasetId}/resources/${chosenResource.id}`,
    }],
    ...(confirmedTabular.length > 1 && { aiEnhanced: `Meilleure ressource sélectionnée parmi ${confirmedTabular.length} candidates par scoring intelligent` }),
  });

  // --- Étape 5 : Interroger les données (avec retry si résultats trop partiels) ---
  emit({ type: "step", step: "query", status: "active", label: "Interrogation des données..." });

  // Build ordered list: chosen first, then remaining confirmed tabular
  const resourcesToTry = [
    chosenResource,
    ...confirmedTabular.filter((r) => r.id !== chosenResource.id),
  ];

  let raw = "";
  let data: ReturnType<typeof parseTabularData> | null = null;
  let usedResource = chosenResource;

  for (let i = 0; i < resourcesToTry.length; i++) {
    const resource = resourcesToTry[i];
    try {
      raw = await withTimeout(
        queryResourceData({
          question,
          resource_id: resource.id,
          page: 1,
          page_size: 20,
        }),
        MCP_TIMEOUT_MS,
        "query_resource_data",
      );
      data = parseTabularData(raw);
      usedResource = resource;

      // If we got enough rows or no more candidates, accept this result
      if (data.totalRows >= MIN_ROWS_THRESHOLD || i === resourcesToTry.length - 1) {
        break;
      }

      // Too few rows — try next candidate
      emit({
        type: "step",
        step: "query",
        status: "active",
        label: `Données partielles (${data.totalRows} lignes), tentative suivante...`,
      });
    } catch {
      // Query failed on this resource, try next
      if (i < resourcesToTry.length - 1) continue;
    }
  }

  try {
    if (!data) {
      throw new Error("Aucune ressource n'a pu être interrogée");
    }

    const provenance: AskProvenance = {
      datasetId: usedResource.datasetId,
      datasetTitle: usedResource.datasetTitle,
      resourceId: usedResource.id,
      resourceTitle: usedResource.title,
      resourceFormat: usedResource.format,
    };

    const retriedQuery = usedResource.id !== chosenResource.id;
    emit({
      type: "step",
      step: "query",
      status: "done",
      label: "Réponse obtenue",
      ...(retriedQuery && { aiEnhanced: `Données partielles détectées — ressource plus complète sélectionnée automatiquement` }),
    });

    // --- Étape 6 : Synthèse LLM ---
    let synthesis: string | null = null;

    if (llmProvider && llmApiKey) {
      emit({
        type: "step",
        step: "synthesis",
        status: "active",
        label: "Synthèse de la réponse...",
      });

      try {
        synthesis = await synthesizeAnswer(llmProvider, llmApiKey, question, raw, data, {
          datasetTitle: provenance.datasetTitle,
          resourceTitle: provenance.resourceTitle,
        });

        emit({
          type: "step",
          step: "synthesis",
          status: "done",
          label: "Synthèse terminée",
          aiEnhanced: "Réponse synthétisée par IA à partir des données brutes",
        });
      } catch (err) {
        console.error("[Synthesis] Error:", err instanceof Error ? err.message : "Unknown error");
        emit({
          type: "step",
          step: "synthesis",
          status: "error",
          label: "Synthèse indisponible",
          detail: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    } else {
      emit({
        type: "step",
        step: "synthesis",
        status: "done",
        label: "Synthèse ignorée",
        aiMissing: "L'IA synthétiserait une réponse claire et structurée à partir des données brutes",
      });
    }

    emit({ type: "result", answer: raw, synthesis, data, provenance });
  } catch (err) {
    emit({ type: "step", step: "query", status: "error", label: "Erreur d'interrogation" });
    emit({ type: "error", step: "query", message: humanizeError(err instanceof Error ? err.message : "Erreur inconnue") });
  }
}
