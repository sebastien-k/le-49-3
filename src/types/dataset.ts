export interface Dataset {
  id: string;
  title: string;
  description: string;
  organization: string;
  organizationId?: string;
  tags: string[];
  resourceCount: number;
  license?: string;
  frequency?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  slug?: string;
}

export interface Resource {
  id: string;
  title: string;
  format: string;
  fileSize: string;
  mimeType: string;
  url: string;
  isTabular: boolean;
  description?: string;
  resourceType?: string;
}

export interface DataService {
  id: string;
  title: string;
  description: string;
  organization: string;
  baseUrl?: string;
  openapiUrl?: string;
  tags: string[];
  license?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
}

export interface MetricsEntry {
  month: string;
  visits: number;
  downloads: number;
}

export interface MetricsData {
  title?: string;
  entries: MetricsEntry[];
  totalVisits: number;
  totalDownloads: number;
}

export interface TabularData {
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
  page: number;
  pageSize: number;
}
