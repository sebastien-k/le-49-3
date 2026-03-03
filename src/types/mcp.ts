// MCP tool parameter types — matches data.gouv.fr MCP server v0.2.18

export interface SearchDatasetsParams {
  query: string;
  page?: number;
  page_size?: number;
}

export interface GetDatasetInfoParams {
  dataset_id: string;
}

export interface ListDatasetResourcesParams {
  dataset_id: string;
}

export interface GetResourceInfoParams {
  resource_id: string;
}

export interface QueryResourceDataParams {
  question: string;
  resource_id: string;
  page?: number;
  page_size?: number;
  filter_column?: string;
  filter_value?: string;
  filter_operator?: "exact" | "contains" | "less" | "greater" | "strictly_less" | "strictly_greater";
  sort_column?: string;
  sort_direction?: "asc" | "desc";
}

export interface DownloadResourceParams {
  resource_id: string;
  max_rows?: number;
  max_size_mb?: number;
}

export interface SearchDataservicesParams {
  query: string;
  page?: number;
  page_size?: number;
}

export interface GetDataserviceInfoParams {
  dataservice_id: string;
}

export interface GetDataserviceOpenapiParams {
  dataservice_id: string;
}

export interface GetMetricsParams {
  dataset_id?: string;
  resource_id?: string;
  limit?: number;
}

// MCP raw response shape
export interface McpTextContent {
  type: "text";
  text: string;
}
