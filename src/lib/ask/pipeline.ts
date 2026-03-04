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
import type { AskEvent, AskProvenance } from "@/types/ask";
import type { Resource } from "@/types/dataset";

// --- Constantes ---

const MCP_TIMEOUT_MS = 30_000;
const MAX_DATASETS = 3;
const MAX_SEARCH_RESULTS = 5;

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

type ResourceCandidate = Resource & { datasetId: string; datasetTitle: string };

export async function runAskPipeline(
  question: string,
  emit: (event: AskEvent) => void,
): Promise<void> {
  // Sanitize input
  question = sanitizeQuestion(question);

  // --- Étape 1 : Extraction mots-clés ---
  emit({ type: "step", step: "keywords", status: "active", label: "Extraction des mots-clés..." });

  const keywords = extractKeywords(question);

  if (keywords.length === 0) {
    emit({ type: "step", step: "keywords", status: "error", label: "Aucun mot-clé extrait" });
    emit({
      type: "error",
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
        type: "error",
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
    });
  } catch (err) {
    emit({ type: "step", step: "search", status: "error", label: "Erreur de recherche" });
    emit({ type: "error", step: "search", message: err instanceof Error ? err.message : "Erreur inconnue" });
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
        type: "error",
        step: "resources",
        message: "Aucune ressource CSV/XLS trouvée dans les datasets. Les données ne sont pas interrogeables.",
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
    });
  } catch (err) {
    emit({ type: "step", step: "resources", status: "error", label: "Erreur d'exploration" });
    emit({ type: "error", step: "resources", message: err instanceof Error ? err.message : "Erreur inconnue" });
    return;
  }

  // --- Étape 4 : Vérifier l'API Tabulaire ---
  emit({ type: "step", step: "tabular-check", status: "active", label: "Vérification de l'API Tabulaire..." });

  let chosenResource: ResourceCandidate | null = null;
  const checkErrors: string[] = [];

  for (const candidate of candidates) {
    try {
      const raw = await withTimeout(
        getResourceInfo({ resource_id: candidate.id }),
        MCP_TIMEOUT_MS,
        `get_resource_info(${candidate.id})`,
      );
      const info = parseResourceInfo(raw);
      if (info?.isTabular) {
        chosenResource = { ...candidate, isTabular: true };
        break;
      }
    } catch (err) {
      checkErrors.push(`${candidate.title}: ${err instanceof Error ? err.message : "erreur"}`);
    }
  }

  if (!chosenResource) {
    emit({
      type: "step",
      step: "tabular-check",
      status: "error",
      label: "Aucune ressource compatible",
    });
    emit({
      type: "error",
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
    label: "Ressource compatible trouvée",
    detail: `${chosenResource.title} (${chosenResource.format})`,
  });

  // --- Étape 5 : Interroger les données ---
  emit({ type: "step", step: "query", status: "active", label: "Interrogation des données..." });

  try {
    const raw = await withTimeout(
      queryResourceData({
        question,
        resource_id: chosenResource.id,
        page: 1,
        page_size: 20,
      }),
      MCP_TIMEOUT_MS,
      "query_resource_data",
    );

    const data = parseTabularData(raw);

    const provenance: AskProvenance = {
      datasetId: chosenResource.datasetId,
      datasetTitle: chosenResource.datasetTitle,
      resourceId: chosenResource.id,
      resourceTitle: chosenResource.title,
      resourceFormat: chosenResource.format,
    };

    emit({ type: "step", step: "query", status: "done", label: "Réponse obtenue" });
    emit({ type: "result", answer: raw, data, provenance });
  } catch (err) {
    emit({ type: "step", step: "query", status: "error", label: "Erreur d'interrogation" });
    emit({ type: "error", step: "query", message: err instanceof Error ? err.message : "Erreur inconnue" });
  }
}
