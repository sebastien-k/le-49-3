"use client";

import { useState, useCallback } from "react";
import type { TabularData } from "@/types/dataset";

interface QueryParams {
  page?: number;
  page_size?: number;
  filter_column?: string;
  filter_value?: string;
  filter_operator?: string;
  sort_column?: string;
  sort_direction?: "asc" | "desc";
}

interface QueryState {
  data: TabularData | null;
  raw: string;
  isLoading: boolean;
  error: string | null;
}

export function useResourceQuery(resourceId: string) {
  const [state, setState] = useState<QueryState>({
    data: null,
    raw: "",
    isLoading: false,
    error: null,
  });

  const query = useCallback(
    async (params: QueryParams = {}) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const res = await fetch(`/api/resources/${resourceId}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: "Show all data",
            page: params.page || 1,
            page_size: params.page_size || 20,
            ...params,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const result = await res.json();
        setState({
          data: result.data,
          raw: result.raw,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Erreur inconnue",
          isLoading: false,
        }));
      }
    },
    [resourceId]
  );

  return { ...state, query };
}
