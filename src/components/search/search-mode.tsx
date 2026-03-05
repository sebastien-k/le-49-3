"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  ArrowLeft,
  Wheat,
  Building2,
  Shield,
  Briefcase,
  Wifi,
  Palette,
  BriefcaseBusiness,
  Scale,
  Palmtree,
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

const DOMAIN_CARDS = [
  // 1. Géographie — fondation de toutes les données territoriales
  {
    icon: MapPin,
    title: "Géographie",
    description: "Cadastre, limites administratives, adresses, cartes",
    examples: "IGN, Cadastre, BAN",
    color: "text-teal-600",
    bg: "bg-teal-50",
    bl: "border-l-teal-500",
    chips: ["Communes", "Adresses", "Cadastre", "Parcelles", "Codes postaux"],
  },
  // 2. Démographie — données les plus consultées sur data.gouv.fr
  {
    icon: Users,
    title: "Démographie",
    description: "Recensement, flux migratoires, naissances par commune",
    examples: "INSEE, INED",
    color: "text-blue-600",
    bg: "bg-blue-50",
    bl: "border-l-blue-500",
    chips: ["Population", "Recensement", "Naissances", "Immigration", "Espérance de vie"],
  },
  // 3. Santé — très recherché (COVID, hôpitaux)
  {
    icon: Heart,
    title: "Santé",
    description: "Établissements de santé, statistiques médicales, épidémiologie",
    examples: "ARS, DREES, Santé publique France",
    color: "text-pink-600",
    bg: "bg-pink-50",
    bl: "border-l-pink-500",
    chips: ["Hôpitaux", "Médecins", "COVID", "Vaccinations", "Pharmacies"],
  },
  // 4. Élections — pics d'intérêt récurrents
  {
    icon: Vote,
    title: "Élections",
    description: "Résultats électoraux, participation, circonscriptions",
    examples: "Min. Intérieur, Conseil constitutionnel",
    color: "text-red-600",
    bg: "bg-red-50",
    bl: "border-l-red-500",
    chips: ["Présidentielle", "Législatives", "Municipales", "Européennes", "Participation"],
  },
  // 5. Emploi — préoccupation quotidienne
  {
    icon: BriefcaseBusiness,
    title: "Emploi",
    description: "Marché du travail, chômage, offres d'emploi, formation",
    examples: "France Travail, DARES, Pôle emploi",
    color: "text-sky-600",
    bg: "bg-sky-50",
    bl: "border-l-sky-500",
    chips: ["Chômage", "Offres emploi", "Salaires", "Formation professionnelle", "Intérim"],
  },
  // 6. Transport
  {
    icon: Train,
    title: "Transport",
    description: "Réseaux de transport, trafic, infrastructures, mobilité",
    examples: "SNCF, RATP, Cerema",
    color: "text-orange-600",
    bg: "bg-orange-50",
    bl: "border-l-orange-500",
    chips: ["SNCF", "Métro", "Vélo", "Accidents route", "Bornes recharge"],
  },
  // 7. Éducation
  {
    icon: GraduationCap,
    title: "Éducation",
    description: "Établissements scolaires, résultats aux examens, effectifs",
    examples: "Min. Éducation nationale, ONISEP",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    bl: "border-l-indigo-500",
    chips: ["Écoles", "Universités", "Baccalauréat", "Apprentissage", "Effectifs étudiants"],
  },
  // 8. Environnement
  {
    icon: Leaf,
    title: "Environnement",
    description: "Qualité de l'air, biodiversité, zones protégées, pollution",
    examples: "ADEME, OFB, Météo-France",
    color: "text-green-600",
    bg: "bg-green-50",
    bl: "border-l-green-500",
    chips: ["Qualité air", "Biodiversité", "Déchets", "Eau potable", "Climat"],
  },
  // 9. Finances publiques
  {
    icon: Landmark,
    title: "Finances publiques",
    description: "Budget de l'État, dépenses, recettes, dette publique",
    examples: "DGFiP, Cour des comptes, DGCL",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    bl: "border-l-emerald-500",
    chips: ["Budget", "Dette", "Impôts", "Collectivités", "Dépenses publiques"],
  },
  // 10. Immobilier
  {
    icon: Building2,
    title: "Immobilier",
    description: "Transactions, prix, logements, permis de construire",
    examples: "DVF, INSEE, Min. Logement",
    color: "text-slate-600",
    bg: "bg-slate-50",
    bl: "border-l-slate-500",
    chips: ["Prix immobilier", "DVF", "Logements sociaux", "Permis construire", "Loyers"],
  },
  // 11. Sécurité
  {
    icon: Shield,
    title: "Sécurité",
    description: "Criminalité, délinquance, forces de l'ordre, accidents",
    examples: "Min. Intérieur, ONDRP",
    color: "text-violet-600",
    bg: "bg-violet-50",
    bl: "border-l-violet-500",
    chips: ["Criminalité", "Délinquance", "Accidents", "Incendies", "Gendarmerie"],
  },
  // 12. Entreprises
  {
    icon: Briefcase,
    title: "Entreprises",
    description: "Créations, registres légaux, défaillances, SIRENE",
    examples: "INSEE (SIRENE), Infogreffe",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    bl: "border-l-cyan-500",
    chips: ["SIRENE", "Créations entreprises", "Défaillances", "Auto-entrepreneurs", "Registre commerce"],
  },
  // 13. Énergie
  {
    icon: Zap,
    title: "Énergie",
    description: "Production, consommation, renouvelables, réseau électrique",
    examples: "RTE, Enedis, ADEME",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    bl: "border-l-yellow-500",
    chips: ["Électricité", "Gaz", "Éolien", "Solaire", "Consommation énergie"],
  },
  // 14. Culture
  {
    icon: Palette,
    title: "Culture",
    description: "Musées, monuments historiques, bibliothèques, festivals",
    examples: "Min. Culture, BnF, Joconde",
    color: "text-rose-600",
    bg: "bg-rose-50",
    bl: "border-l-rose-500",
    chips: ["Musées", "Monuments historiques", "Bibliothèques", "Cinéma", "Festivals"],
  },
  // 15. Agriculture
  {
    icon: Wheat,
    title: "Agriculture",
    description: "Exploitations, productions, labels, aides agricoles",
    examples: "Min. Agriculture, INAO, FranceAgriMer",
    color: "text-amber-600",
    bg: "bg-amber-50",
    bl: "border-l-amber-500",
    chips: ["Exploitations", "Bio", "Viticulture", "PAC", "Élevage"],
  },
  // 16. Justice
  {
    icon: Scale,
    title: "Justice",
    description: "Tribunaux, contentieux, données pénales, accès au droit",
    examples: "Min. Justice, Légifrance",
    color: "text-stone-600",
    bg: "bg-stone-50",
    bl: "border-l-stone-500",
    chips: ["Tribunaux", "Contentieux", "Données pénales", "Prisons", "Aide juridictionnelle"],
  },
  // 17. Tourisme
  {
    icon: Palmtree,
    title: "Tourisme",
    description: "Hébergements, fréquentation touristique, sites classés",
    examples: "Atout France, DGE, INSEE",
    color: "text-lime-600",
    bg: "bg-lime-50",
    bl: "border-l-lime-500",
    chips: ["Hôtels", "Camping", "Fréquentation", "Sites touristiques", "Offices de tourisme"],
  },
  // 18. Numérique
  {
    icon: Wifi,
    title: "Numérique",
    description: "Couverture réseau, fibre, accès internet, données télécom",
    examples: "ARCEP, ANCT",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    bl: "border-l-fuchsia-500",
    chips: ["Fibre", "4G 5G", "Couverture internet", "Open data", "Services publics numériques"],
  },
];

export function SearchMode() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { results, total, isLoading, error, page, tab, setTab, search } =
    useSearch();

  // Sync from URL query param (e.g. navigating from dataset tag click)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q && q !== query) setQuery(q);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery, 1);
    }
  }, [debouncedQuery, search]);

  // Reset selected domain when user types manually
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selectedDomain) setSelectedDomain(null);
  };

  const totalPages = Math.ceil(total / 20);
  const hasSearched = debouncedQuery.length > 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <SearchBar value={query} onChange={handleQueryChange} />
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
                    <DatasetCard key={dataset.id} dataset={dataset} onTagClick={handleQueryChange} />
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
        <div className="space-y-6">
          {/* Selected domain: compact banner + chips */}
          {selectedDomain && (() => {
            const domain = DOMAIN_CARDS.find(({ title }) => title === selectedDomain);
            if (!domain) return null;
            const { icon: Icon, title, description, color, bg, bl, chips } = domain;
            return (
              <div className={`rounded-xl border border-border border-l-2 ${bl} bg-card p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDomain(null)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Tous les domaines</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5 justify-center">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQueryChange(`${title.toLowerCase()} ${chip.toLowerCase()}`)}
                      className="rounded-full border border-border bg-secondary/50 px-5 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Domain Grid (visible when no domain selected) */}
          {!selectedDomain && (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {DOMAIN_CARDS.map(({ icon: Icon, title, description, examples, color, bg, bl }) => (
                  <button
                    key={title}
                    onClick={() => setSelectedDomain(title)}
                    className={`group w-full flex flex-col items-start gap-3 rounded-xl border border-border border-l-2 ${bl} bg-card p-5 text-left transition-all hover:shadow-md hover:border-primary/50`}
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

              {/* Producteurs majeurs */}
              <div className="flex items-center gap-4 mt-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#000091" }}>
                  Producteurs majeurs
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                {[
                  { name: "INSEE", query: "insee" },
                  { name: "IGN", query: "ign" },
                  { name: "Météo-France", query: "météo" },
                  { name: "ADEME", query: "ademe" },
                  { name: "Santé publique France", query: "santé publique" },
                  { name: "Min. Intérieur", query: "élections" },
                  { name: "SNCF", query: "sncf" },
                  { name: "Cour des comptes", query: "cour des comptes" },
                ].map((producer) => (
                  <button
                    key={producer.name}
                    onClick={() => handleQueryChange(producer.query)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {producer.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
