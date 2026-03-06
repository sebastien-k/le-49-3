# Le 49.3 — Extracteur de données Open Data français

> *Le 49.3 : Parce que vos requêtes n'ont pas besoin de majorité.*

## Obsidian

Note projet : `Notes/💻 Dev Projects/Le 49.3.md`

## Déploiement

- **URL** : https://le493.fr (domaine custom Gandi → Vercel)
- **URL Vercel** : https://le-quarante-neuf-trois.vercel.app
- **Projet Vercel** : `sebastiens-projects-354db3cd/le-quarante-neuf-trois`
- **Déploiement** : Automatique via GitHub (push → Vercel build)
- **Domaine** : `le493.fr` acheté chez Gandi, DNS A → `76.76.21.21`, CNAME www → `cname.vercel-dns.com`

## Description

Application web Next.js qui se connecte au serveur MCP officiel de data.gouv.fr pour extraire, explorer et visualiser les données ouvertes françaises.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first, `@theme inline`, pas de `tailwind.config.ts`)
- shadcn/ui (composants Radix + `sonner` pour les toasts)
- `@modelcontextprotocol/sdk` (client MCP Streamable HTTP)
- `@anthropic-ai/sdk`, `openai`, `@google/genai` (synthèse LLM multi-provider — BYOK côté client)
- `@tanstack/react-table` (tableau de données)
- `lucide-react` (icônes)
- `@vercel/analytics` (analytics sans cookies, custom events)
- `vitest` + `@vitest/coverage-v8` (tests unitaires)

## MCP Server

- **Endpoint** : `https://mcp.data.gouv.fr/mcp`
- **Transport** : Streamable HTTP (POST JSON-RPC)
- **Auth** : Aucune (open data public)
- **Réponses** : Texte pré-formaté (pas JSON) → parsers nécessaires

### Outils disponibles (10)

| Outil | Paramètres clés |
|-------|----------------|
| `search_datasets` | query, page?, page_size? (max 100) |
| `get_dataset_info` | dataset_id |
| `list_dataset_resources` | dataset_id |
| `get_resource_info` | resource_id |
| `query_resource_data` | question, resource_id, page?, page_size? (max 200), filter_*, sort_* |
| `download_and_parse_resource` | resource_id, max_rows?, max_size_mb? |
| `search_dataservices` | query, page?, page_size? (max 100) |
| `get_dataservice_info` | dataservice_id |
| `get_dataservice_openapi_spec` | dataservice_id |
| `get_metrics` | dataset_id?, resource_id?, limit? (max 100) |

## Architecture

### Flux de données
- **Server Components** (détail dataset/dataservice) → appel direct `lib/mcp/tools.ts`
- **Client Components** (recherche, viewer ressource) → `fetch(/api/...)` → API Route → `lib/mcp/tools.ts`

### Structure clé
```
src/
├── lib/mcp/          # Client MCP singleton, wrappers typés, cache, parsers, errors.ts (humanizeError)
├── lib/ask/          # Pipeline Ask (recherche → query → synthèse), module synthesis.ts
├── lib/llm/          # Config multi-provider (providers.ts), getActiveProviderFromStorage()
├── app/api/          # Routes API pour les pages interactives uniquement
├── components/       # UI (shadcn), layout, search, ask, datasets, resources, dataservices, shared
├── hooks/            # useSearch, useResourceQuery, useAsk, useResourceChat, useDataExport, useDebounce
├── __tests__/        # Tests unitaires (vitest) : types, providers, synthesis
└── types/            # Types MCP, Dataset, API
```

### Vercel Analytics
- `@vercel/analytics` — `<Analytics />` dans `layout.tsx`, GDPR compliant (pas de cookies)
- Custom events via `track()` dans les hooks :
  - `search` (query, tab, results) dans `useSearch`
  - `ask` (question, outcome, dataset, hasSynthesis) dans `useAsk`

### BYOK (Bring Your Own Key) — Multi-Provider
- 3 providers supportés : Anthropic (Claude Haiku), OpenAI (GPT-4o mini), Gemini (Gemini 2.5 Flash)
- Config centralisée dans `lib/llm/providers.ts` (PROVIDERS array + `getActiveProviderFromStorage()`)
- Clés stockées dans `localStorage` par provider (`le-49-3-anthropic-key`, `le-49-3-openai-key`, `le-49-3-gemini-key`)
- Envoyées par requête, jamais persistées côté serveur
- Sans clé : les features fonctionnent sans synthèse (fallback données brutes)
- Avec clé : synthèse LLM dans Ask et Chat ressource
- Priorité automatique : premier provider configuré dans l'ordre Anthropic → OpenAI → Gemini
- UI : onglets dans la carte BYOK avec instructions par provider et lien vers la console

### SEO (`lib/seo/`)
- Constantes dans `lib/seo/constants.ts` (SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION)
- JSON-LD : `lib/seo/json-ld.ts` (datasetJsonLd, dataserviceJsonLd) + composant `components/seo/json-ld-script.tsx`
- `generateMetadata()` sur dataset, resource et dataservice pages — chaque enfant doit répéter `images` (Next.js ne deep-merge pas openGraph)
- `robots.ts` + `sitemap.ts` (homepage only — 200k+ datasets trop nombreux)
- OG image : `public/og-image.jpg` (1200x630, JPEG < 100 KB)

### Ask Pipeline (`lib/ask/pipeline.ts`)
- Pipeline SSE multi-étapes : search → filter → tabular-check → query → synthesis → result
- Stepper UI avec liens cliquables vers datasets/ressources
- Événements SSE : `step` (progression), `result` (succès), `info` (pas de données — non-erreur), `error` (erreur technique)
- Extraction mots-clés : LLM si clé API dispo (avec fallback silencieux vers extraction mécanique par stop-words)
- Sélection de ressource par scoring (keywords dans titre/description, format CSV, type "main")
- Synthèse via `lib/ask/synthesis.ts` (multi-provider, timeout 15s, max 512 tokens)
- Composant partagé `components/shared/synthesis-content.tsx` (markdown léger : bold, bullets, paragraphes)

## Conventions

- Style amber pour avertissements non-bloquants : `rounded-md border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300`
- Erreur technique = rouge (`ErrorDisplay` + bouton Réessayer) ; info sans données = gris (`Info` icon, pas de retry)
- `lang="fr"` sur le HTML root
- Composants UI dans `components/ui/` (shadcn)
- Composants métier organisés par domaine (`search/`, `datasets/`, `resources/`, etc.)
- Chaque réponse API inclut `raw` (texte brut MCP) en plus des données parsées
- Fallback `<McpTextRenderer>` si le parsing échoue
- Cache LRU en mémoire (Map, max 200 entrées) avec TTL par type de données

### Métriques (`get_metrics`)
- MCP renvoie un format différent selon le scope : dataset (3 colonnes : Month/Visits/Downloads) vs resource (2 colonnes : Month/Downloads)
- `parseMetrics` détecte le format via la ligne header (`hasVisits = trimmed.includes("Visits")`)
- Page dataset : graphique SVG interactif (`components/datasets/metrics-chart.tsx`) + téléchargements par ressource dans la liste
- Page ressource : total downloads inline dans le header
