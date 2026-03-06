import type { Dataset, Resource, DataService, MetricsData, MetricsEntry, TabularData } from "@/types/dataset";

/**
 * Parse search_datasets response.
 *
 * Format:
 *   Found N dataset(s) for query: '...'
 *   Page X of results:
 *
 *   1. Title
 *      ID: xxx
 *      Organization: xxx
 *      Tags: tag1, tag2
 *      Resources: N
 *      URL: https://...
 */
export function parseSearchDatasets(text: string): { total: number; datasets: Dataset[] } {
  const totalMatch = text.match(/Found (\d+) dataset/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const datasets: Dataset[] = [];
  const blocks = text.split(/\n\d+\.\s+/).slice(1); // Split by numbered items

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const title = lines[0] || "";
    const id = extractField(lines, "ID");
    const organization = extractField(lines, "Organization");
    const tagsStr = extractField(lines, "Tags");
    const resourceCount = parseInt(extractField(lines, "Resources") || "0", 10);
    const url = extractField(lines, "URL");

    if (id) {
      datasets.push({
        id,
        title,
        description: "",
        organization,
        tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [],
        resourceCount,
        url,
      });
    }
  }

  return { total, datasets };
}

/**
 * Parse get_dataset_info response.
 *
 * Format:
 *   Dataset Information: Title
 *   ID: xxx
 *   Slug: xxx
 *   URL: xxx
 *   Full description: ...
 *   Organization: xxx
 *   Organization ID: xxx
 *   Tags: tag1, tag2
 *   Resources: N file(s)
 *   Created: ...
 *   Last updated: ...
 *   License: ...
 *   Update frequency: ...
 */
export function parseDatasetInfo(text: string): Dataset | null {
  const lines = text.split("\n").map((l) => l.trim());

  const titleMatch = text.match(/Dataset Information:\s*(.+)/);
  const title = titleMatch ? titleMatch[1] : "";

  const id = extractField(lines, "ID");
  if (!id) return null;

  const descMatch = text.match(/Full description:\s*([\s\S]*?)(?=\n\s*Organization:)/);
  const description = descMatch ? descMatch[1].trim() : "";

  const organization = extractField(lines, "Organization");
  const organizationId = extractField(lines, "Organization ID");
  const tagsStr = extractField(lines, "Tags");
  const resourcesStr = extractField(lines, "Resources");
  const resourceCount = resourcesStr ? parseInt(resourcesStr, 10) : 0;
  const license = extractField(lines, "License");
  const frequency = extractField(lines, "Update frequency");
  const createdAt = extractField(lines, "Created");
  const updatedAt = extractField(lines, "Last updated");
  const url = extractField(lines, "URL");
  const slug = extractField(lines, "Slug");

  return {
    id,
    title,
    description,
    organization,
    organizationId,
    tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [],
    resourceCount,
    license,
    frequency,
    createdAt,
    updatedAt,
    url,
    slug,
  };
}

/**
 * Parse list_dataset_resources response.
 *
 * Format:
 *   Resources in dataset: Title
 *   Dataset ID: xxx
 *   Total resources: N
 *
 *   1. Filename.csv
 *      Resource ID: xxx
 *      Format: csv
 *      Type: main
 *      URL: https://...
 */
export function parseResourceList(text: string): Resource[] {
  const resources: Resource[] = [];

  if (text.includes("has no resources")) return resources;

  const blocks = text.split(/\n\d+\.\s+/).slice(1);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const title = lines[0] || "";
    const id = extractField(lines, "Resource ID");
    const format = extractField(lines, "Format");
    const fileSize = extractField(lines, "Size") || "";
    const mimeType = extractField(lines, "MIME type") || "";
    const url = extractField(lines, "URL");
    const resourceType = extractField(lines, "Type") || "";

    if (id) {
      resources.push({
        id,
        title,
        format: format || "",
        fileSize,
        mimeType,
        url: url || "",
        isTabular: false,
        resourceType,
      });
    }
  }

  return resources;
}

/**
 * Parse get_resource_info response.
 *
 * Format:
 *   Resource Information: Title
 *   Resource ID: xxx
 *   Format: csv
 *   Type: main
 *   Size: 1.2 MB
 *   MIME type: text/csv
 *   URL: https://...
 *   Dataset ID: xxx
 *   Dataset: Title
 *   Tabular API availability:
 *   ✅ Available via Tabular API (can be queried)
 */
export function parseResourceInfo(text: string): Resource | null {
  const lines = text.split("\n").map((l) => l.trim());

  const titleMatch = text.match(/Resource Information:\s*(.+)/);
  const title = titleMatch ? titleMatch[1] : "";

  const id = extractField(lines, "Resource ID");
  if (!id) return null;

  const format = extractField(lines, "Format") || "";
  const fileSize = extractField(lines, "Size") || "";
  const mimeType = extractField(lines, "MIME type") || "";
  const url = extractField(lines, "URL") || "";
  const resourceType = extractField(lines, "Type") || "";
  const isTabular = text.includes("✅") && text.includes("Tabular API");

  return {
    id,
    title,
    format,
    fileSize,
    mimeType,
    url,
    isTabular,
    resourceType,
  };
}

/**
 * Parse query_resource_data response.
 *
 * Format:
 *   Querying resource: Title
 *   Resource ID: xxx
 *   ...
 *   Total rows (Tabular API): N
 *   Columns: col1, col2, col3
 *
 *   Data (N rows):
 *     Row 1:
 *       col1: value1
 *       col2: value2
 *     Row 2:
 *       col1: value1
 *       col2: value2
 */
export function parseTabularData(text: string): TabularData {
  const totalMatch = text.match(/Total rows.*?:\s*(\d+)/);
  const totalRows = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const pagesMatch = text.match(/Total pages:\s*(\d+)\s*\(page size:\s*(\d+)\)/);
  const pageSize = pagesMatch ? parseInt(pagesMatch[2], 10) : 20;

  const pageMatch = text.match(/page\s+(\d+)/i);
  const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;

  const columnsMatch = text.match(/Columns:\s*(.+)/);
  const columns = columnsMatch
    ? columnsMatch[1].split(",").map((c) => c.trim())
    : [];

  const rows: Record<string, string>[] = [];
  const rowBlocks = text.split(/\s+Row \d+:/);

  for (let i = 1; i < rowBlocks.length; i++) {
    const row: Record<string, string> = {};
    const lines = rowBlocks[i].split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Match "key: value" pattern (first colon only)
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const key = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();
        if (columns.includes(key) || columns.length === 0) {
          row[key] = value;
        }
      }
    }

    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }

  return { columns, rows, totalRows, page, pageSize };
}

/**
 * Parse search_dataservices response.
 *
 * Format:
 *   Found N dataservice(s) for query: '...'
 *   Page X of results:
 *
 *   1. Title
 *      ID: xxx
 *      Description: ...
 *      Organization: xxx
 *      Base API URL: https://...
 *      Tags: tag1, tag2
 *      URL: https://...
 */
export function parseSearchDataservices(text: string): { total: number; dataservices: DataService[] } {
  const totalMatch = text.match(/Found (\d+) dataservice/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const dataservices: DataService[] = [];
  const blocks = text.split(/\n\d+\.\s+/).slice(1);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const title = lines[0] || "";
    const id = extractField(lines, "ID");
    const organization = extractField(lines, "Organization");
    const baseUrl = extractField(lines, "Base API URL");
    const tagsStr = extractField(lines, "Tags");
    const url = extractField(lines, "URL");

    // Description can be multi-line, extract up to Organization
    const descStartIdx = lines.findIndex((l) => l.startsWith("Description:"));
    let description = "";
    if (descStartIdx >= 0) {
      const descLines: string[] = [];
      descLines.push(lines[descStartIdx].replace(/^Description:\s*/, ""));
      for (let j = descStartIdx + 1; j < lines.length; j++) {
        if (lines[j].startsWith("Organization:") || lines[j].startsWith("Base API URL:") || lines[j].startsWith("Tags:")) break;
        descLines.push(lines[j]);
      }
      description = descLines.join(" ").trim();
    }

    if (id) {
      dataservices.push({
        id,
        title,
        description,
        organization: organization || "",
        baseUrl,
        tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [],
        url,
      });
    }
  }

  return { total, dataservices };
}

/**
 * Parse get_dataservice_info response.
 */
export function parseDataserviceInfo(text: string): DataService | null {
  const lines = text.split("\n").map((l) => l.trim());

  const titleMatch = text.match(/(?:Dataservice|API) Information:\s*(.+)/i);
  const title = titleMatch ? titleMatch[1] : extractField(lines, "Title") || "";

  const id = extractField(lines, "ID") || extractField(lines, "Dataservice ID");
  if (!id) return null;

  const descMatch = text.match(/(?:Full )?[Dd]escription:\s*([\s\S]*?)(?=\n\s*(?:Organization|Base API|Tags|Created):)/);
  const description = descMatch ? descMatch[1].trim() : "";

  const organization = extractField(lines, "Organization") || "";
  const baseUrl = extractField(lines, "Base API URL");
  const openapiUrl = extractField(lines, "OpenAPI") || extractField(lines, "Swagger");
  const tagsStr = extractField(lines, "Tags");
  const license = extractField(lines, "License");
  const createdAt = extractField(lines, "Created");
  const updatedAt = extractField(lines, "Last updated");
  const url = extractField(lines, "URL");

  return {
    id,
    title,
    description,
    organization,
    baseUrl,
    openapiUrl,
    tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [],
    license,
    createdAt,
    updatedAt,
    url,
  };
}

/**
 * Parse get_metrics response.
 *
 * Format:
 *   Dataset Metrics: Title
 *   Dataset ID: xxx
 *
 *   Monthly Statistics:
 *   ------------------------------------------------------------
 *   Month        Visits          Downloads
 *   ------------------------------------------------------------
 *   2026-03      36              14
 *   2026-02      755             394
 *   ------------------------------------------------------------
 *   Total        1,670           702
 */
export function parseMetrics(text: string): MetricsData {
  const titleMatch = text.match(/(?:Dataset|Resource) Metrics:\s*(.+)/);
  const title = titleMatch ? titleMatch[1] : undefined;

  const entries: MetricsEntry[] = [];
  let totalVisits = 0;
  let totalDownloads = 0;

  const lines = text.split("\n");
  let dashCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("---")) {
      dashCount++;
      continue;
    }

    if (trimmed.startsWith("Month")) continue;

    if (trimmed.startsWith("Total")) {
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 3) {
        totalVisits = parseInt(parts[1].replace(/,/g, ""), 10) || 0;
        totalDownloads = parseInt(parts[2].replace(/,/g, ""), 10) || 0;
      }
      continue;
    }

    // Data rows are between the 2nd dash line (after header) and the 3rd
    if (dashCount === 2 && trimmed) {
      const parts = trimmed.split(/\s{2,}/);
      if (parts.length >= 3) {
        entries.push({
          month: parts[0],
          visits: parseInt(parts[1].replace(/,/g, ""), 10) || 0,
          downloads: parseInt(parts[2].replace(/,/g, ""), 10) || 0,
        });
      }
    }
  }

  return { title, entries, totalVisits, totalDownloads };
}

// --- Helpers ---

function extractField(lines: string[], fieldName: string): string {
  for (const line of lines) {
    // Match "Field Name: value" (case-insensitive on first word)
    const regex = new RegExp(`^${escapeRegex(fieldName)}:\\s*(.+)`, "i");
    const match = line.match(regex);
    if (match) return match[1].trim();
  }
  return "";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
