"use client";

import { useState, useEffect } from "react";
import { Database, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/search/search-bar";
import { DatasetCard } from "@/components/search/dataset-card";
import { DataserviceCard } from "@/components/search/dataservice-card";
import { ErrorDisplay } from "@/components/shared/error-display";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearch } from "@/hooks/use-search";
import type { Dataset, DataService } from "@/types/dataset";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { results, total, isLoading, error, page, tab, setTab, search } =
    useSearch();

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery, 1);
    }
  }, [debouncedQuery, search]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Le 49.3</h1>
        </div>
        <p className="text-muted-foreground">
          Parce que vos requêtes n&apos;ont pas besoin de majorité.
        </p>
      </div>

      {/* Search */}
      <SearchBar value={query} onChange={setQuery} />

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "datasets" | "dataservices");
        }}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="dataservices">APIs</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Interrogation du MCP data.gouv.fr...
            </span>
          </div>
        )}

        {error && (
          <ErrorDisplay
            message={error}
            onRetry={() => search(debouncedQuery, page)}
          />
        )}

        {!isLoading && !error && results.length === 0 && debouncedQuery && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun résultat pour &quot;{debouncedQuery}&quot;</p>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && !debouncedQuery && (
          <div className="text-center py-12 text-muted-foreground">
            <p>
              Recherchez des datasets ou des APIs dans l&apos;Open Data français
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          results.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {total} résultat{total > 1 ? "s" : ""} trouvé
                {total > 1 ? "s" : ""}
              </p>

              {tab === "datasets"
                ? (results as Dataset[]).map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))
                : (results as DataService[]).map((ds) => (
                    <DataserviceCard key={ds.id} dataservice={ds} />
                  ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (page > 1) search(debouncedQuery, page - 1);
                        }}
                        className={
                          page <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm text-muted-foreground px-4">
                        Page {page} / {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          if (page < totalPages)
                            search(debouncedQuery, page + 1);
                        }}
                        className={
                          page >= totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
      </div>
    </div>
  );
}
