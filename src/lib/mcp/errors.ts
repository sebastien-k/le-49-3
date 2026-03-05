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

// --- Messages d'erreur user-friendly ---

const ERROR_PATTERNS: [RegExp, string][] = [
  [/Streamable HTTP error/i, "Le serveur data.gouv.fr est temporairement indisponible. Réessayez dans quelques instants."],
  [/Unexpected content type:\s*text\/html/i, "Le serveur data.gouv.fr a renvoyé une réponse inattendue."],
  [/fetch failed|econnrefused|econnreset|connection_closed/i, "Impossible de contacter le serveur data.gouv.fr. Vérifiez votre connexion."],
  [/timeout/i, "La requête a pris trop de temps. Le serveur est peut-être surchargé."],
  [/not connected/i, "La connexion au serveur data.gouv.fr a été perdue."],
  [/rate limit|\b429\b/i, "Trop de requêtes envoyées. Patientez quelques secondes avant de réessayer."],
];

export function humanizeError(message: string): string {
  for (const [pattern, friendly] of ERROR_PATTERNS) {
    if (pattern.test(message)) return friendly;
  }
  return message;
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
