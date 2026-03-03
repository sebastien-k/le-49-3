/**
 * Test script to connect to data.gouv.fr MCP and capture raw response formats.
 * Run with: node scripts/test-mcp.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.data.gouv.fr/mcp";

async function main() {
  console.log("=== Connecting to data.gouv.fr MCP... ===\n");

  const client = new Client({ name: "le-49-3-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

  await client.connect(transport);
  console.log("Connected!\n");

  // Test 1: search_datasets
  console.log("=== search_datasets (query: 'population france') ===");
  const searchResult = await client.callTool({
    name: "search_datasets",
    arguments: { query: "population france", page: 1, page_size: 3 },
  });
  console.log(JSON.stringify(searchResult, null, 2));
  console.log("\n--- RAW TEXT ---");
  for (const c of searchResult.content) {
    if (c.type === "text") console.log(c.text);
  }

  // Test 2: get_dataset_info — extract first dataset ID from search
  const searchText = searchResult.content?.find(c => c.type === "text")?.text || "";
  const idMatch = searchText.match(/ID:\s*([a-f0-9]+)/i);
  if (idMatch) {
    const datasetId = idMatch[1];
    console.log(`\n=== get_dataset_info (dataset_id: '${datasetId}') ===`);
    const infoResult = await client.callTool({
      name: "get_dataset_info",
      arguments: { dataset_id: datasetId },
    });
    console.log("\n--- RAW TEXT ---");
    for (const c of infoResult.content) {
      if (c.type === "text") console.log(c.text);
    }

    // Test 3: list_dataset_resources
    console.log(`\n=== list_dataset_resources (dataset_id: '${datasetId}') ===`);
    const resourcesResult = await client.callTool({
      name: "list_dataset_resources",
      arguments: { dataset_id: datasetId },
    });
    console.log("\n--- RAW TEXT ---");
    for (const c of resourcesResult.content) {
      if (c.type === "text") console.log(c.text);
    }
  }

  // Test 4: search_dataservices
  console.log("\n=== search_dataservices (query: 'adresse') ===");
  const dsResult = await client.callTool({
    name: "search_dataservices",
    arguments: { query: "adresse", page: 1, page_size: 3 },
  });
  console.log("\n--- RAW TEXT ---");
  for (const c of dsResult.content) {
    if (c.type === "text") console.log(c.text);
  }

  await client.close();
  console.log("\n=== Done! ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
