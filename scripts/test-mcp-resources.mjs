/**
 * Test MCP resource tools to capture tabular data format.
 * Run with: node scripts/test-mcp-resources.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.data.gouv.fr/mcp";

async function main() {
  const client = new Client({ name: "le-49-3-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await client.connect(transport);

  // Search for a dataset with CSV resources
  const searchResult = await client.callTool({
    name: "search_datasets",
    arguments: { query: "communes population INSEE", page: 1, page_size: 5 },
  });
  const searchText = searchResult.content?.find(c => c.type === "text")?.text || "";
  console.log("=== Search results ===");
  console.log(searchText);

  // Find a dataset with resources
  const datasets = searchText.matchAll(/ID:\s*([a-f0-9]+)[\s\S]*?Resources:\s*(\d+)/g);
  let targetDatasetId = null;
  for (const m of datasets) {
    if (parseInt(m[2]) > 0) {
      targetDatasetId = m[1];
      break;
    }
  }

  if (!targetDatasetId) {
    console.log("No dataset with resources found, trying known dataset...");
    targetDatasetId = "65b1a75892f5a30b16f72943"; // Population municipale des départements
  }

  console.log(`\n=== list_dataset_resources (${targetDatasetId}) ===`);
  const resList = await client.callTool({
    name: "list_dataset_resources",
    arguments: { dataset_id: targetDatasetId },
  });
  const resText = resList.content?.find(c => c.type === "text")?.text || "";
  console.log(resText);

  // Get first resource ID
  const resIdMatch = resText.match(/Resource ID:\s*([a-f0-9-]+)/i);
  if (resIdMatch) {
    const resourceId = resIdMatch[1];

    console.log(`\n=== get_resource_info (${resourceId}) ===`);
    const resInfo = await client.callTool({
      name: "get_resource_info",
      arguments: { resource_id: resourceId },
    });
    const resInfoText = resInfo.content?.find(c => c.type === "text")?.text || "";
    console.log(resInfoText);

    // Try query_resource_data
    console.log(`\n=== query_resource_data (${resourceId}) ===`);
    try {
      const queryResult = await client.callTool({
        name: "query_resource_data",
        arguments: {
          question: "Show all data",
          resource_id: resourceId,
          page: 1,
          page_size: 5,
        },
      });
      const queryText = queryResult.content?.find(c => c.type === "text")?.text || "";
      console.log(queryText);
    } catch (err) {
      console.log("query_resource_data error:", err.message);
    }
  }

  // Test get_metrics
  console.log(`\n=== get_metrics (${targetDatasetId}) ===`);
  try {
    const metricsResult = await client.callTool({
      name: "get_metrics",
      arguments: { dataset_id: targetDatasetId, limit: 3 },
    });
    const metricsText = metricsResult.content?.find(c => c.type === "text")?.text || "";
    console.log(metricsText);
  } catch (err) {
    console.log("get_metrics error:", err.message);
  }

  await client.close();
  console.log("\n=== Done! ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
