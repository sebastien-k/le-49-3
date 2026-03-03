"use client";

interface McpTextRendererProps {
  raw: string;
  className?: string;
}

export function McpTextRenderer({ raw, className = "" }: McpTextRendererProps) {
  return (
    <pre
      className={`whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto ${className}`}
    >
      {raw}
    </pre>
  );
}
