import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, Download, FileText, Scale, RefreshCw, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatBadge } from "@/components/shared/format-badge";
import { McpTextRenderer } from "@/components/shared/mcp-text-renderer";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { MetricsChart } from "@/components/datasets/metrics-chart";
import { getDatasetInfo, listDatasetResources, getMetrics } from "@/lib/mcp/tools";
import { parseDatasetInfo, parseResourceList, parseMetrics } from "@/lib/mcp/parsers";
import { datasetJsonLd } from "@/lib/seo/json-ld";

interface Props {
  params: Promise<{ datasetId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { datasetId } = await params;
  const rawInfo = await getDatasetInfo({ dataset_id: datasetId });
  const dataset = parseDatasetInfo(rawInfo);

  if (!dataset) {
    return { title: "Dataset introuvable" };
  }

  const description = dataset.description
    ? dataset.description.slice(0, 160)
    : `Dataset ${dataset.title} sur data.gouv.fr — ${dataset.resourceCount} ressource(s)`;

  return {
    title: dataset.title,
    description,
    openGraph: {
      title: dataset.title,
      description,
      type: "website",
      url: `/datasets/${datasetId}`,
      images: ["/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: dataset.title,
      description,
    },
    alternates: {
      canonical: `/datasets/${datasetId}`,
    },
  };
}

export default async function DatasetPage({ params }: Props) {
  const { datasetId } = await params;

  const [rawInfo, rawResources, rawMetrics] = await Promise.all([
    getDatasetInfo({ dataset_id: datasetId }),
    listDatasetResources({ dataset_id: datasetId }),
    getMetrics({ dataset_id: datasetId }).catch(() => ""),
  ]);

  const dataset = parseDatasetInfo(rawInfo);
  const resources = parseResourceList(rawResources);
  const metrics = rawMetrics ? parseMetrics(rawMetrics) : null;

  // Fetch per-resource download metrics in parallel (capped to avoid rate-limiting)
  const MAX_RESOURCE_METRICS = 20;
  const resourceMetricsResults = await Promise.allSettled(
    resources.slice(0, MAX_RESOURCE_METRICS).map((r) =>
      getMetrics({ resource_id: r.id }).then((raw) => ({
        id: r.id,
        metrics: parseMetrics(raw),
      }))
    )
  );
  const resourceDownloads = new Map<string, number>();
  for (const result of resourceMetricsResults) {
    if (result.status === "fulfilled" && result.value.metrics) {
      resourceDownloads.set(result.value.id, result.value.metrics.totalDownloads);
    }
  }

  if (!dataset) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">Dataset introuvable</h1>
        <McpTextRenderer raw={rawInfo} className="mt-4" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <JsonLdScript data={datasetJsonLd(dataset, datasetId)} />

      {/* Breadcrumb */}
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour à la recherche
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold">{dataset.title}</h1>

      {dataset.organization && (
        <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{dataset.organization}</span>
        </div>
      )}

      {dataset.description && (
        <div className="mt-4 text-muted-foreground leading-relaxed">
          <MarkdownContent content={dataset.description} />
        </div>
      )}

      {/* Tags */}
      {dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {dataset.tags.map((tag) => (
            <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {dataset.license && (
          <MetaItem icon={Scale} label="Licence" value={dataset.license} />
        )}
        {dataset.frequency && (
          <MetaItem icon={RefreshCw} label="Fréquence" value={dataset.frequency} />
        )}
        {dataset.createdAt && (
          <MetaItem
            icon={Calendar}
            label="Créé le"
            value={new Date(dataset.createdAt).toLocaleDateString("fr-FR")}
          />
        )}
        {dataset.updatedAt && (
          <MetaItem
            icon={Calendar}
            label="Mis à jour"
            value={new Date(dataset.updatedAt).toLocaleDateString("fr-FR")}
          />
        )}
      </div>

      {dataset.url && (
        <a
          href={dataset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
        >
          Voir sur data.gouv.fr <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <Separator className="my-6" />

      {/* Resources & Metrics tabs */}
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">
            <FileText className="h-4 w-4 mr-1" />
            Ressources ({resources.length})
          </TabsTrigger>
          <TabsTrigger value="metrics">Statistiques</TabsTrigger>
          <TabsTrigger value="raw">Texte brut</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="mt-4 space-y-3">
          {resources.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Ce dataset ne contient aucune ressource.
            </p>
          ) : (
            resources.map((resource) => {
              const queryable = ["csv", "tsv", "xls", "xlsx"].includes(
                (resource.format || "").toLowerCase()
              );
              const downloads = resourceDownloads.get(resource.id);
              return (
                <Link
                  key={resource.id}
                  href={`/datasets/${datasetId}/resources/${resource.id}`}
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FormatBadge format={resource.format || "?"} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {resource.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {resource.fileSize && (
                              <span>{resource.fileSize}</span>
                            )}
                            {downloads != null && downloads > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Download className="h-3 w-3" />
                                {downloads.toLocaleString("fr-FR")} téléchargements
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {queryable && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          <MessageSquare className="h-3 w-3" />
                          Interrogeable
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          {metrics ? (
            <MetricsChart metrics={metrics} />
          ) : (
            <p className="text-muted-foreground text-sm py-4">
              Pas de statistiques disponibles.
            </p>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <McpTextRenderer raw={`--- Dataset Info ---\n${rawInfo}\n\n--- Resources ---\n${rawResources}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
