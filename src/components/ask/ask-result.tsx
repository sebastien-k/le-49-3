"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Database, FileSpreadsheet } from "lucide-react";
import type { AskResultEvent } from "@/types/ask";

interface AskResultProps {
  result: AskResultEvent;
}

const TEXT_COLLAPSE_THRESHOLD = 400;

export function AskResult({ result }: AskResultProps) {
  const [textExpanded, setTextExpanded] = useState(false);
  const { answer, data, provenance } = result;

  const isLongText = answer.length > TEXT_COLLAPSE_THRESHOLD;
  const displayText =
    isLongText && !textExpanded ? answer.slice(0, TEXT_COLLAPSE_THRESHOLD) + "..." : answer;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Texte MCP */}
      <div>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 break-words">
          {displayText}
        </pre>
        {isLongText && (
          <button
            onClick={() => setTextExpanded(!textExpanded)}
            className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
          >
            {textExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Voir la réponse complète
              </>
            )}
          </button>
        )}
      </div>

      {/* Mini-tableau */}
      {data && data.rows.length > 0 && (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {data.columns
                  .filter((c) => c !== "__id")
                  .slice(0, 6)
                  .map((col) => (
                    <th key={col} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-border/50">
                  {data.columns
                    .filter((c) => c !== "__id")
                    .slice(0, 6)
                    .map((col) => (
                      <td
                        key={col}
                        className="px-2 py-1 max-w-[150px] truncate whitespace-nowrap"
                        title={row[col]}
                      >
                        {row[col]}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalRows > 5 && (
            <div className="text-xs text-muted-foreground px-2 py-1.5 border-t">
              {data.totalRows} lignes au total
            </div>
          )}
        </div>
      )}

      {/* Provenance */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Source :</span>
        <Link
          href={`/datasets/${provenance.datasetId}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Database className="h-3 w-3" />
          {provenance.datasetTitle}
        </Link>
        <Link
          href={`/datasets/${provenance.datasetId}/resources/${provenance.resourceId}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <FileSpreadsheet className="h-3 w-3" />
          {provenance.resourceTitle}
          {provenance.resourceFormat && (
            <span className="uppercase text-muted-foreground">({provenance.resourceFormat})</span>
          )}
        </Link>
      </div>
    </div>
  );
}
