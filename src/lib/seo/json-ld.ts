import type { Dataset, DataService } from "@/types/dataset";
import { SITE_URL } from "./constants";

export function datasetJsonLd(dataset: Dataset, datasetId: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: dataset.title,
    description:
      dataset.description || `Dataset ${dataset.title} sur data.gouv.fr`,
    url: `${SITE_URL}/datasets/${datasetId}`,
    ...(dataset.license && { license: dataset.license }),
    ...(dataset.organization && {
      creator: { "@type": "Organization", name: dataset.organization },
    }),
    ...(dataset.tags.length > 0 && { keywords: dataset.tags }),
    ...(dataset.createdAt && { dateCreated: dataset.createdAt }),
    ...(dataset.updatedAt && { dateModified: dataset.updatedAt }),
  };
}

export function dataserviceJsonLd(
  ds: DataService,
  dataserviceId: string,
): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    name: ds.title,
    description: ds.description || `API ${ds.title} sur data.gouv.fr`,
    url: `${SITE_URL}/dataservices/${dataserviceId}`,
    ...(ds.baseUrl && { documentation: ds.baseUrl }),
    ...(ds.organization && {
      provider: { "@type": "Organization", name: ds.organization },
    }),
    ...(ds.tags.length > 0 && { keywords: ds.tags }),
    ...(ds.createdAt && { dateCreated: ds.createdAt }),
    ...(ds.updatedAt && { dateModified: ds.updatedAt }),
  };
}
