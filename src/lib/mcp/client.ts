import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { isConnectionError, McpToolError } from "./errors";

const MCP_URL = "https://mcp.data.gouv.fr/mcp";
const TOOL_TIMEOUT = 30_000;

let clientInstance: Client | null = null;
let connectionPromise: Promise<Client> | null = null;

async function createClient(): Promise<Client> {
  const client = new Client({
    name: "le-49-3",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

  client.onerror = (error) => {
    console.error("[MCP] Transport error:", error);
    clientInstance = null;
    connectionPromise = null;
  };

  client.onclose = () => {
    console.warn("[MCP] Connection closed");
    clientInstance = null;
    connectionPromise = null;
  };

  await client.connect(transport);
  return client;
}

export async function getMcpClient(): Promise<Client> {
  if (clientInstance) return clientInstance;

  if (!connectionPromise) {
    connectionPromise = createClient()
      .then((client) => {
        clientInstance = client;
        return client;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

function extractTextContent(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const client = await getMcpClient();

  try {
    const result = await client.callTool(
      { name: toolName, arguments: args },
      undefined,
      { timeout: TOOL_TIMEOUT }
    );

    if (result.isError) {
      throw new McpToolError(toolName, extractTextContent(result));
    }

    return extractTextContent(result);
  } catch (error) {
    // On connection errors, reset and retry once
    if (isConnectionError(error)) {
      console.warn(`[MCP] Connection error on ${toolName}, retrying...`);
      clientInstance = null;
      connectionPromise = null;

      const freshClient = await getMcpClient();
      const result = await freshClient.callTool(
        { name: toolName, arguments: args },
        undefined,
        { timeout: TOOL_TIMEOUT }
      );

      if (result.isError) {
        throw new McpToolError(toolName, extractTextContent(result));
      }

      return extractTextContent(result);
    }
    throw error;
  }
}
