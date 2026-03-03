import Link from "next/link";
import { ArrowLeft, Globe, Building2, Calendar, Scale, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McpTextRenderer } from "@/components/shared/mcp-text-renderer";
import { getDataserviceInfo, getDataserviceOpenapi } from "@/lib/mcp/tools";
import { parseDataserviceInfo } from "@/lib/mcp/parsers";

interface Props {
  params: Promise<{ dataserviceId: string }>;
}

export default async function DataservicePage({ params }: Props) {
  const { dataserviceId } = await params;

  const [rawInfo, rawOpenapi] = await Promise.all([
    getDataserviceInfo({ dataservice_id: dataserviceId }),
    getDataserviceOpenapi({ dataservice_id: dataserviceId }).catch(() => ""),
  ]);

  const dataservice = parseDataserviceInfo(rawInfo);

  if (!dataservice) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold">Dataservice introuvable</h1>
        <McpTextRenderer raw={rawInfo} className="mt-4" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à la recherche
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Globe className="h-6 w-6 text-primary mt-1 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">{dataservice.title}</h1>
          {dataservice.organization && (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{dataservice.organization}</span>
            </div>
          )}
        </div>
      </div>

      {dataservice.description && (
        <p className="mt-4 text-muted-foreground leading-relaxed">
          {dataservice.description}
        </p>
      )}

      {/* Tags */}
      {dataservice.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {dataservice.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {dataservice.baseUrl && (
          <div>
            <p className="text-xs text-muted-foreground">URL de base</p>
            <a
              href={dataservice.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-primary hover:underline break-all"
            >
              {dataservice.baseUrl}
            </a>
          </div>
        )}
        {dataservice.license && (
          <div className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Licence</p>
              <p className="text-sm font-medium">{dataservice.license}</p>
            </div>
          </div>
        )}
        {dataservice.updatedAt && (
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Mis à jour</p>
              <p className="text-sm font-medium">
                {new Date(dataservice.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        )}
      </div>

      {dataservice.url && (
        <a
          href={dataservice.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
        >
          Voir sur data.gouv.fr <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <Separator className="my-6" />

      {/* OpenAPI spec */}
      <Tabs defaultValue="openapi">
        <TabsList>
          <TabsTrigger value="openapi">Spec OpenAPI</TabsTrigger>
          <TabsTrigger value="raw">Texte brut</TabsTrigger>
        </TabsList>

        <TabsContent value="openapi" className="mt-4">
          {rawOpenapi ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Spécification OpenAPI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <McpTextRenderer raw={rawOpenapi} />
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground text-sm py-4">
              Pas de spécification OpenAPI disponible.
            </p>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <McpTextRenderer raw={rawInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
