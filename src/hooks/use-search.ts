"use client";

import { useState, useCallback } from "react";
import type { Dataset } from "@/types/dataset";
import type { DataService } from "@/types/dataset";

type SearchTab = "datasets" | "dataservices";

interface SearchState {
  results: Dataset[] | DataService[];
  total: number;
  raw: string;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
}

export function useSearch() {
  const [tab, setTab] = useState<SearchTab>("datasets");
  const [state, setState] = useState<SearchState>({
    results: [],
    total: 0,
    raw: "",
    isLoading: false,
    error: null,
    page: 1,
    pageSize: 20,
  });

  const search = useCallback(
    async (query: string, page: number = 1) => {
      if (!query.trim()) {
        setState((s) => ({ ...s, results: [], total: 0, raw: "", error: null }));
        return;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const endpoint =
          tab === "datasets"
            ? "/api/datasets/search"
            : "/api/dataservices/search";

        const params = new URLSearchParams({
          q: query,
          page: String(page),
          page_size: String(state.pageSize),
        });

        const res = await fetch(`${endpoint}?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setState((s) => ({
          ...s,
          results: data.results,
          total: data.total || 0,
          raw: data.raw,
          page,
          isLoading: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Erreur inconnue",
          results: [],
          isLoading: false,
        }));
      }
    },
    [tab, state.pageSize]
  );

  return { ...state, tab, setTab, search };
}
