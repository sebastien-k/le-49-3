import { cache } from "react";
import { callMcpTool } from "./client";
import { getCachedOrFetch } from "./cache";
import type {
  SearchDatasetsParams,
  GetDatasetInfoParams,
  ListDatasetResourcesParams,
  GetResourceInfoParams,
  QueryResourceDataParams,
  DownloadResourceParams,
  SearchDataservicesParams,
  GetDataserviceInfoParams,
  GetDataserviceOpenapiParams,
  GetMetricsParams,
} from "@/types/mcp";

// --- Dataset tools ---

export async function searchDatasets(params: SearchDatasetsParams): Promise<string> {
  return callMcpTool("search_datasets", {
    query: params.query,
    ...(params.page != null && { page: params.page }),
    ...(params.page_size != null && { page_size: params.page_size }),
  });
}

const _getDatasetInfoById = cache(async (datasetId: string): Promise<string> => {
  return getCachedOrFetch(
    `dataset:${datasetId}`,
    () => callMcpTool("get_dataset_info", { dataset_id: datasetId }),
    { ttl: 300 }
  );
});

export async function getDatasetInfo(params: GetDatasetInfoParams): Promise<string> {
  return _getDatasetInfoById(params.dataset_id);
}

export async function listDatasetResources(params: ListDatasetResourcesParams): Promise<string> {
  return getCachedOrFetch(
    `dataset-resources:${params.dataset_id}`,
    () => callMcpTool("list_dataset_resources", { dataset_id: params.dataset_id }),
    { ttl: 300 }
  );
}

export async function getResourceInfo(params: GetResourceInfoParams): Promise<string> {
  return getCachedOrFetch(
    `resource:${params.resource_id}`,
    () => callMcpTool("get_resource_info", { resource_id: params.resource_id }),
    { ttl: 300 }
  );
}

export async function queryResourceData(params: QueryResourceDataParams): Promise<string> {
  return callMcpTool("query_resource_data", {
    question: params.question,
    resource_id: params.resource_id,
    ...(params.page != null && { page: params.page }),
    ...(params.page_size != null && { page_size: params.page_size }),
    ...(params.filter_column && { filter_column: params.filter_column }),
    ...(params.filter_value != null && { filter_value: params.filter_value }),
    ...(params.filter_operator && { filter_operator: params.filter_operator }),
    ...(params.sort_column && { sort_column: params.sort_column }),
    ...(params.sort_direction && { sort_direction: params.sort_direction }),
  });
}

export async function downloadAndParseResource(params: DownloadResourceParams): Promise<string> {
  return callMcpTool("download_and_parse_resource", {
    resource_id: params.resource_id,
    ...(params.max_rows != null && { max_rows: params.max_rows }),
    ...(params.max_size_mb != null && { max_size_mb: params.max_size_mb }),
  });
}

// --- Dataservice tools ---

export async function searchDataservices(params: SearchDataservicesParams): Promise<string> {
  return callMcpTool("search_dataservices", {
    query: params.query,
    ...(params.page != null && { page: params.page }),
    ...(params.page_size != null && { page_size: params.page_size }),
  });
}

export async function getDataserviceInfo(params: GetDataserviceInfoParams): Promise<string> {
  return getCachedOrFetch(
    `dataservice:${params.dataservice_id}`,
    () => callMcpTool("get_dataservice_info", { dataservice_id: params.dataservice_id }),
    { ttl: 600 }
  );
}

export async function getDataserviceOpenapi(params: GetDataserviceOpenapiParams): Promise<string> {
  return getCachedOrFetch(
    `dataservice-openapi:${params.dataservice_id}`,
    () => callMcpTool("get_dataservice_openapi_spec", { dataservice_id: params.dataservice_id }),
    { ttl: 3600 }
  );
}

// --- Metrics ---

export async function getMetrics(params: GetMetricsParams): Promise<string> {
  const key = `metrics:${params.dataset_id || ""}:${params.resource_id || ""}:${params.limit || 12}`;
  return getCachedOrFetch(
    key,
    () => callMcpTool("get_metrics", {
      ...(params.dataset_id && { dataset_id: params.dataset_id }),
      ...(params.resource_id && { resource_id: params.resource_id }),
      ...(params.limit != null && { limit: params.limit }),
    }),
    { ttl: 600 }
  );
}
