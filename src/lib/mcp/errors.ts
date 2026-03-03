export class McpConnectionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "McpConnectionError";
  }
}

export class McpToolError extends Error {
  constructor(
    public readonly toolName: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`Tool "${toolName}" failed: ${message}`);
    this.name = "McpToolError";
  }
}

export class McpTimeoutError extends Error {
  constructor(public readonly toolName: string, public readonly timeoutMs: number) {
    super(`Tool "${toolName}" timed out after ${timeoutMs}ms`);
    this.name = "McpTimeoutError";
  }
}

export function isConnectionError(error: unknown): boolean {
  if (error instanceof McpConnectionError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("connection_closed")
      || msg.includes("econnrefused")
      || msg.includes("fetch failed")
      || msg.includes("econnreset")
      || msg.includes("not connected");
  }
  return false;
}
