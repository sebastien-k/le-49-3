import type { TabularData } from "./dataset";

// --- LLM Provider ---

export type LlmProvider = "anthropic" | "openai" | "gemini";

// --- Pipeline step identifiers ---

export type AskStepId =
  | "keywords"
  | "search"
  | "resources"
  | "tabular-check"
  | "query"
  | "synthesis";

export type AskStepStatus = "pending" | "active" | "done" | "error";

// --- SSE Events ---

export interface AskStepLink {
  label: string;
  href: string;
}

export interface AskStepEvent {
  type: "step";
  step: AskStepId;
  status: AskStepStatus;
  label: string;
  detail?: string;
  links?: AskStepLink[];
  aiEnhanced?: string; // Short message shown in green badge when AI improved this step
}

export interface AskResultEvent {
  type: "result";
  answer: string;
  synthesis: string | null;
  data: TabularData | null;
  provenance: AskProvenance;
}

export interface AskInfoEvent {
  type: "info";
  step: AskStepId | "unknown";
  message: string;
}

export interface AskErrorEvent {
  type: "error";
  step: AskStepId | "unknown";
  message: string;
}

export type AskEvent = AskStepEvent | AskResultEvent | AskInfoEvent | AskErrorEvent;

// --- Provenance ---

export interface AskProvenance {
  datasetId: string;
  datasetTitle: string;
  resourceId: string;
  resourceTitle: string;
  resourceFormat: string;
}

// --- Client state ---

export interface AskStep {
  id: AskStepId;
  label: string;
  status: AskStepStatus;
  detail?: string;
  links?: AskStepLink[];
  aiEnhanced?: string;
}

export interface AskState {
  status: "idle" | "loading" | "done" | "info" | "error";
  question: string;
  steps: AskStep[];
  result: AskResultEvent | null;
  error: string | null;
}
