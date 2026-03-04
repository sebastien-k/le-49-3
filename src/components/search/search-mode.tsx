"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Users,
  GraduationCap,
  Train,
  Zap,
  Vote,
  Heart,
  Landmark,
  MapPin,
  Leaf,
} from "lucide-react";
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

const THEME_CHIPS = [
  "Population",
  "Emploi",
  "Transport",
  "Éducation",
  "Logement",
  "Santé",
  "Énergie",
  "Élections",
  "Budget",
  "Environnement",
  "Culture",
  "Justice",
];

const DOMAIN_CARDS = [
  {
    icon: Users,
    title: "Démographie",
    description: "Recensement, démographie, flux migratoires, naissances par commune",
    examples: "INSEE, INED",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: GraduationCap,
    title: "Éducation",
    description: "Établissements scolaires, résultats aux examens, effectifs étudiants",
    examples: "Min. Éducation nationale, ONISEP",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Train,
    title: "Transport",
    description: "Réseaux de transport, trafic, infrastructures, lignes de métro",
    examples: "SNCF, RATP, Cerema",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Zap,
    title: "Énergie",
    description: "Production, consommation, énergies renouvelables, réseau électrique",
    examples: "RTE, Enedis, ADEME",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    icon: Vote,
    title: "Élections",
    description: "Résultats électoraux, participation, découpage des circonscriptions",
    examples: "Min. Intérieur, Conseil constitutionnel",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Heart,
    title: "Santé",
    description: "Établissements de santé, statistiques médicales, épidémiologie",
    examples: "ARS, DREES, Santé publique France",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: Landmark,
    title: "Finances publiques",
    description: "Budget de l'État, dépenses, recettes, dette, collectivités locales",
    examples: "DGFiP, Cour des comptes, DGCL",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: MapPin,
    title: "Géographie",
    description: "Cadastre, limites administratives, adresses, cartes, parcelles",
    examples: "IGN, Cadastre, BAN",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: Leaf,
    title: "Environnement",
    description: "Qualité de l'air, biodiversité, zones protégées, pollution",
    examples: "ADEME, OFB, Météo-France",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

export function SearchMode() {
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
  const hasSearched = debouncedQuery.length > 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* Tabs datasets/APIs */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "datasets" | "dataservices");
        }}
      >
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="dataservices">APIs</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
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

          {!isLoading && !error && results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun r&eacute;sultat pour &quot;{debouncedQuery}&quot;</p>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {total} r&eacute;sultat{total > 1 ? "s" : ""} trouv&eacute;
                {total > 1 ? "s" : ""}
              </p>

              {tab === "datasets"
                ? (results as Dataset[]).map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))
                : (results as DataService[]).map((ds) => (
                    <DataserviceCard key={ds.id} dataservice={ds} />
                  ))}

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
      )}

      {/* Discovery Section (visible only when no search) */}
      {!hasSearched && (
        <div className="space-y-10">
          {/* Theme Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {THEME_CHIPS.map((theme) => (
              <button
                key={theme}
                onClick={() => setQuery(theme.toLowerCase())}
                className="rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                {theme}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Les donn&eacute;es de la R&eacute;publique
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Domain Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOMAIN_CARDS.map(({ icon: Icon, title, description, examples, color, bg }) => (
              <button
                key={title}
                onClick={() => setQuery(title.toLowerCase())}
                className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-card-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {examples}
                </p>
              </button>
            ))}
          </div>

          {/* Narrative Text */}
          <div className="mx-auto max-w-2xl text-center space-y-3 pt-2">
            <p className="text-muted-foreground leading-relaxed">
              La R&eacute;publique produit des donn&eacute;es. Beaucoup de donn&eacute;es.
              L&apos;INSEE compte les citoyens, M&eacute;t&eacute;o-France surveille le ciel,
              l&apos;IGN cartographie chaque parcelle, le minist&egrave;re de l&apos;Int&eacute;rieur
              recense chaque scrutin. Tout est l&agrave;, en acc&egrave;s libre.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Le 49.3 vous y donne acc&egrave;s sans passer par la proc&eacute;dure parlementaire.
            </p>
          </div>

          {/* Major Producers */}
          <div className="pt-2 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Producteurs majeurs
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {[
                { name: "INSEE", query: "insee" },
                { name: "IGN", query: "ign" },
                { name: "M\u00e9t\u00e9o-France", query: "m\u00e9t\u00e9o" },
                { name: "ADEME", query: "ademe" },
                { name: "Sant\u00e9 publique France", query: "sant\u00e9 publique" },
                { name: "Min. Int\u00e9rieur", query: "\u00e9lections" },
                { name: "SNCF", query: "sncf" },
                { name: "Cour des comptes", query: "cour des comptes" },
              ].map((producer) => (
                <button
                  key={producer.name}
                  onClick={() => setQuery(producer.query)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {producer.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
