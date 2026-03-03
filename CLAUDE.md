# Le 49.3 — Extracteur de données Open Data français

> *Le 49.3 : Parce que vos requêtes n'ont pas besoin de majorité.*

## Obsidian

Note projet : `Notes/💻 Dev Projects/Le 49.3.md`

## Description

Application web Next.js qui se connecte au serveur MCP officiel de data.gouv.fr pour extraire, explorer et visualiser les données ouvertes françaises.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first, `@theme inline`, pas de `tailwind.config.ts`)
- shadcn/ui (composants Radix)
- `@modelcontextprotocol/sdk` (client MCP Streamable HTTP)
- `@tanstack/react-table` (tableau de données)
- `lucide-react` (icônes)

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
├── lib/mcp/          # Client MCP singleton, wrappers typés, cache, parsers
├── app/api/          # Routes API pour les pages interactives uniquement
├── components/       # UI (shadcn), layout, search, datasets, resources, dataservices, shared
├── hooks/            # useSearch, useResourceQuery, useDataExport, useDebounce
└── types/            # Types MCP, Dataset, API
```

## Conventions

- `lang="fr"` sur le HTML root
- Composants UI dans `components/ui/` (shadcn)
- Composants métier organisés par domaine (`search/`, `datasets/`, `resources/`, etc.)
- Chaque réponse API inclut `raw` (texte brut MCP) en plus des données parsées
- Fallback `<McpTextRenderer>` si le parsing échoue
- Cache LRU en mémoire (Map, max 200 entrées) avec TTL par type de données
