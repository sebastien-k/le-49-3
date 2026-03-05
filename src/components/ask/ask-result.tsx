"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Database, FileSpreadsheet, Key, Sparkles } from "lucide-react";
import { SynthesisContent } from "@/components/shared/synthesis-content";
import type { AskResultEvent } from "@/types/ask";

interface AskResultProps {
  result: AskResultEvent;
}

const TEXT_COLLAPSE_THRESHOLD = 400;

export function AskResult({ result }: AskResultProps) {
  const [rawExpanded, setRawExpanded] = useState(false);
  const { answer, synthesis, data, provenance } = result;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      {/* Synthèse LLM (mise en avant) */}
      {synthesis && (
        <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/10 p-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed text-foreground space-y-2">
            <SynthesisContent text={synthesis} />
          </div>
        </div>
      )}

      {/* Bandeau incitation clé API */}
      {!synthesis && (
        <button
          onClick={() => {
            const el = document.getElementById("byok-card");
            if (el) { el.scrollIntoView({ behavior: "smooth" }); el.querySelector("button")?.click(); }
          }}
          className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors w-full text-left"
        >
          <Key className="h-4 w-4 shrink-0" />
          <span>
            Ajoutez une <span className="font-semibold">cl&eacute; API</span> pour obtenir une synth&egrave;se claire de ces donn&eacute;es au lieu du texte brut.
          </span>
        </button>
      )}

      {/* Données brutes MCP */}
      {synthesis ? (
        <div>
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {rawExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {rawExpanded ? "Masquer les données brutes" : "Voir les données brutes"}
          </button>
          {rawExpanded && (
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/70 break-words">
              {answer}
            </pre>
          )}
        </div>
      ) : (
        <RawAnswer answer={answer} />
      )}

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

/** Affichage brut avec expand/collapse pour les textes longs (comportement original) */
function RawAnswer({ answer }: { answer: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = answer.length > TEXT_COLLAPSE_THRESHOLD;
  const displayText =
    isLong && !expanded ? answer.slice(0, TEXT_COLLAPSE_THRESHOLD) + "..." : answer;

  return (
    <div>
      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 break-words">
        {displayText}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
        >
          {expanded ? (
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
  );
}
