import Link from "next/link";
import { ArrowLeft, Building2, Calendar, FileText, Scale, RefreshCw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatBadge } from "@/components/shared/format-badge";
import { McpTextRenderer } from "@/components/shared/mcp-text-renderer";
import { getDatasetInfo, listDatasetResources, getMetrics } from "@/lib/mcp/tools";
import { parseDatasetInfo, parseResourceList, parseMetrics } from "@/lib/mcp/parsers";

interface Props {
  params: Promise<{ datasetId: string }>;
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
        <p className="mt-4 text-muted-foreground leading-relaxed">
          {dataset.description}
        </p>
      )}

      {/* Tags */}
      {dataset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {dataset.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
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
            resources.map((resource) => (
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
                        {resource.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            {resource.fileSize}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          {metrics && metrics.entries.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Visites et téléchargements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4">Mois</th>
                        <th className="py-2 pr-4 text-right">Visites</th>
                        <th className="py-2 text-right">Téléchargements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.entries.map((entry) => (
                        <tr key={entry.month} className="border-b last:border-0">
                          <td className="py-2 pr-4">{entry.month}</td>
                          <td className="py-2 pr-4 text-right font-mono">
                            {entry.visits.toLocaleString("fr-FR")}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {entry.downloads.toLocaleString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold">
                        <td className="py-2 pr-4">Total</td>
                        <td className="py-2 pr-4 text-right font-mono">
                          {metrics.totalVisits.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {metrics.totalDownloads.toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
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
