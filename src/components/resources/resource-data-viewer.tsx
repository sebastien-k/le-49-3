"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, Copy, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { DataTable } from "./data-table";
import { McpTextRenderer } from "@/components/shared/mcp-text-renderer";
import { ErrorDisplay } from "@/components/shared/error-display";
import { useResourceQuery } from "@/hooks/use-resource-query";
import { toast } from "sonner";

interface ResourceDataViewerProps {
  resourceId: string;
}

const FILTER_OPERATORS = [
  { value: "exact", label: "=" },
  { value: "contains", label: "contient" },
  { value: "less", label: "<=" },
  { value: "greater", label: ">=" },
  { value: "strictly_less", label: "<" },
  { value: "strictly_greater", label: ">" },
];

export function ResourceDataViewer({ resourceId }: ResourceDataViewerProps) {
  const { data, raw, isLoading, error, query } = useResourceQuery(resourceId);

  // Filter state
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filterOperator, setFilterOperator] = useState("exact");

  // Sort state
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // View toggle
  const [showRaw, setShowRaw] = useState(false);

  // Initial load
  useEffect(() => {
    query({ page: 1, page_size: pageSize });
  }, [query, pageSize]);

  const handleFilter = () => {
    setCurrentPage(1);
    query({
      page: 1,
      page_size: pageSize,
      ...(filterColumn && filterValue && {
        filter_column: filterColumn,
        filter_value: filterValue,
        filter_operator: filterOperator,
      }),
      ...(sortColumn && {
        sort_column: sortColumn,
        sort_direction: sortDirection,
      }),
    });
  };

  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);
    setCurrentPage(1);
    query({
      page: 1,
      page_size: pageSize,
      ...(filterColumn && filterValue && {
        filter_column: filterColumn,
        filter_value: filterValue,
        filter_operator: filterOperator,
      }),
      sort_column: column,
      sort_direction: newDirection,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    query({
      page,
      page_size: pageSize,
      ...(filterColumn && filterValue && {
        filter_column: filterColumn,
        filter_value: filterValue,
        filter_operator: filterOperator,
      }),
      ...(sortColumn && {
        sort_column: sortColumn,
        sort_direction: sortDirection,
      }),
    });
  };

  const handleCopyJson = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data.rows, null, 2));
      toast.success("JSON copié dans le presse-papier");
    }
  };

  const handleDownloadCsv = () => {
    if (!data || data.rows.length === 0) return;

    const cols = data.columns.filter((c) => c !== "__id");
    const header = cols.join(",");
    const rows = data.rows.map((row) =>
      cols.map((col) => `"${(row[col] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${resourceId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV téléchargé");
  };

  const totalPages = data ? Math.ceil(data.totalRows / pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Filters */}
        {data && data.columns.length > 0 && (
          <>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Colonne</label>
              <Select value={filterColumn} onValueChange={setFilterColumn}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Colonne" />
                </SelectTrigger>
                <SelectContent>
                  {data.columns
                    .filter((c) => c !== "__id")
                    .map((col) => (
                      <SelectItem key={col} value={col} className="text-xs">
                        {col}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Opérateur</label>
              <Select value={filterOperator} onValueChange={setFilterOperator}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value} className="text-xs">
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Valeur</label>
              <Input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Valeur"
                className="w-[160px] h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilter();
                }}
              />
            </div>

            <Button size="sm" variant="outline" className="h-8" onClick={handleFilter}>
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filtrer
            </Button>
          </>
        )}

        {/* Sort button */}
        {data && data.columns.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Trier par</label>
            <Select value={sortColumn} onValueChange={(col) => handleSort(col)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Trier..." />
              </SelectTrigger>
              <SelectContent>
                {data.columns
                  .filter((c) => c !== "__id")
                  .map((col) => (
                    <SelectItem key={col} value={col} className="text-xs">
                      {col} {sortColumn === col ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Export buttons */}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-8" onClick={handleCopyJson} disabled={!data}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleDownloadCsv} disabled={!data}>
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant={showRaw ? "default" : "outline"}
            className="h-8"
            onClick={() => setShowRaw(!showRaw)}
          >
            Brut
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Requête en cours...
          </span>
        </div>
      )}

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={() => query({ page: currentPage, page_size: pageSize })} />}

      {/* Data table or raw */}
      {!isLoading && !error && data && (
        <>
          <p className="text-xs text-muted-foreground">
            {data.totalRows} ligne{data.totalRows > 1 ? "s" : ""} au total
            — page {currentPage}/{totalPages || 1}
          </p>

          {showRaw ? (
            <McpTextRenderer raw={raw} />
          ) : (
            <DataTable data={data} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
