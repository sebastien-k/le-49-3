import type { Dataset, Resource, DataService, MetricsData, TabularData } from "./dataset";

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export interface SearchResponse<T> {
  results: T[];
  raw: string;
  page: number;
  pageSize: number;
}

export type DatasetSearchResponse = SearchResponse<Dataset>;
export type DataserviceSearchResponse = SearchResponse<DataService>;

export interface DatasetDetailResponse {
  dataset: Dataset;
  raw: string;
}

export interface ResourceListResponse {
  resources: Resource[];
  raw: string;
}

export interface ResourceDetailResponse {
  resource: Resource;
  raw: string;
}

export interface ResourceQueryResponse {
  data: TabularData;
  raw: string;
}

export interface DataserviceDetailResponse {
  dataservice: DataService;
  raw: string;
}

export interface MetricsResponse {
  metrics: MetricsData;
  raw: string;
}
