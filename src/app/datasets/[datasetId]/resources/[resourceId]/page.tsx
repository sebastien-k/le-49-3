import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormatBadge } from "@/components/shared/format-badge";
import { McpTextRenderer } from "@/components/shared/mcp-text-renderer";
import { ResourceDataViewer } from "@/components/resources/resource-data-viewer";
import { Eye } from "lucide-react";
import { getResourceInfo, getDatasetInfo, getMetrics } from "@/lib/mcp/tools";
import { parseResourceInfo, parseDatasetInfo, parseMetrics } from "@/lib/mcp/parsers";

interface Props {
  params: Promise<{ datasetId: string; resourceId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { datasetId, resourceId } = await params;
  const [rawResource, rawDataset] = await Promise.all([
    getResourceInfo({ resource_id: resourceId }),
    getDatasetInfo({ dataset_id: datasetId }).catch(() => ""),
  ]);

  const resource = parseResourceInfo(rawResource);
  const dataset = rawDataset ? parseDatasetInfo(rawDataset) : null;

  if (!resource) {
    return { title: "Ressource introuvable" };
  }

  const title = dataset
    ? `${resource.title} — ${dataset.title}`
    : resource.title;
  const description = `Ressource ${resource.format?.toUpperCase() || ""} ${resource.fileSize ? `(${resource.fileSize})` : ""} — ${dataset?.title || "data.gouv.fr"}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/datasets/${datasetId}/resources/${resourceId}`,
      images: ["/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/datasets/${datasetId}/resources/${resourceId}`,
    },
  };
}

export default async function ResourcePage({ params }: Props) {
  const { datasetId, resourceId } = await params;

  const [rawResource, rawDataset, rawMetrics] = await Promise.all([
    getResourceInfo({ resource_id: resourceId }),
    getDatasetInfo({ dataset_id: datasetId }).catch(() => ""),
    getMetrics({ resource_id: resourceId }).catch(() => ""),
  ]);

  const resource = parseResourceInfo(rawResource);
  const dataset = rawDataset ? parseDatasetInfo(rawDataset) : null;
  const metrics = rawMetrics ? parseMetrics(rawMetrics) : null;

  if (!resource) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Link
          href={`/datasets/${datasetId}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au dataset
        </Link>
        <h1 className="text-2xl font-bold">Ressource introuvable</h1>
        <McpTextRenderer raw={rawResource} className="mt-4" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6 min-w-0 overflow-hidden">
        <Link href="/" className="hover:text-foreground shrink-0">
          Recherche
        </Link>
        <span className="shrink-0">/</span>
        <Link href={`/datasets/${datasetId}`} className="hover:text-foreground truncate max-w-[40vw]">
          {dataset?.title || datasetId}
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-foreground truncate">{resource.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-0">
            <FormatBadge format={resource.format || "?"} />
            <h1 className="text-xl font-bold break-words min-w-0">{resource.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-sm text-muted-foreground">
            {resource.fileSize && <span>{resource.fileSize}</span>}
            {resource.mimeType && <span>{resource.mimeType}</span>}
            {metrics && metrics.totalVisits > 0 && (
              <span className="flex items-center gap-1" title="Visites sur data.gouv.fr (12 derniers mois)">
                <Eye className="h-3.5 w-3.5" />
                {metrics.totalVisits.toLocaleString("fr-FR")} visites
              </span>
            )}
            {metrics && metrics.totalDownloads > 0 && (
              <span className="flex items-center gap-1" title="Telechargements sur data.gouv.fr (12 derniers mois)">
                <Download className="h-3.5 w-3.5" />
                {metrics.totalDownloads.toLocaleString("fr-FR")} tel.
              </span>
            )}
            {resource.isTabular && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                API Tabulaire
              </Badge>
            )}
            {resource.isTabular && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                <MessageSquare className="h-3 w-3" />
                Interrogeable
              </span>
            )}
          </div>
        </div>

        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5 mr-1" />
              Télécharger
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        )}
      </div>

      <Separator className="my-6" />

      {/* Data viewer */}
      {resource.isTabular ? (
        <ResourceDataViewer
          resourceId={resourceId}
          resourceTitle={resource.title}
          datasetTitle={dataset?.title}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Cette ressource n&apos;est pas disponible via l&apos;API Tabulaire.
          </p>
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </a>
          )}
          <McpTextRenderer raw={rawResource} className="mt-6" />
        </div>
      )}
    </div>
  );
}
