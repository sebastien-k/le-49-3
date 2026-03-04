import type { TabularData } from "./dataset";

// --- Pipeline step identifiers ---

export type AskStepId =
  | "keywords"
  | "search"
  | "resources"
  | "tabular-check"
  | "query";

export type AskStepStatus = "pending" | "active" | "done" | "error";

// --- SSE Events ---

export interface AskStepEvent {
  type: "step";
  step: AskStepId;
  status: AskStepStatus;
  label: string;
  detail?: string;
}

export interface AskResultEvent {
  type: "result";
  answer: string;
  data: TabularData | null;
  provenance: AskProvenance;
}

export interface AskErrorEvent {
  type: "error";
  step: AskStepId | "unknown";
  message: string;
}

export type AskEvent = AskStepEvent | AskResultEvent | AskErrorEvent;

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
}

export interface AskState {
  status: "idle" | "loading" | "done" | "error";
  question: string;
  steps: AskStep[];
  result: AskResultEvent | null;
  error: string | null;
}
