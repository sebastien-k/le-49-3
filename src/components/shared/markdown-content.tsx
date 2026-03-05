import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match: **bold**, [text](url), *italic*, `code`
  // Match: **bold** (or unclosed **bold at end), [text](url), *italic*, `code`
  const regex = /\*\*(.+?)\*\*|\*\*(.+?)$|\[([^\]]+)\]\(([^)]+)\)|\*(.+?)\*|`([^`]+)`/gm;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] || match[2]) {
      // match[1] = closed **bold**, match[2] = unclosed **bold at end of line
      nodes.push(<strong key={match.index}>{match[1] || match[2]}</strong>);
    } else if (match[3] && match[4]) {
      const url = match[4];
      const isSafe = /^https?:\/\//.test(url) || url.startsWith("/");
      if (isSafe) {
        nodes.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            {match[3]}
          </a>
        );
      } else {
        nodes.push(match[0]);
      }
    } else if (match[5]) {
      nodes.push(<em key={match.index}>{match[5]}</em>);
    } else if (match[6]) {
      nodes.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1 py-0.5 text-sm"
        >
          {match[6]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderBlock(block: string, index: number): React.ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  // Headers
  const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/m);
  if (headerMatch && trimmed.startsWith("#")) {
    const level = headerMatch[1].length;
    const text = headerMatch[2];
    const classes: Record<number, string> = {
      1: "text-lg font-semibold mt-4 mb-1",
      2: "text-base font-semibold mt-3 mb-1",
      3: "text-sm font-semibold mt-2 mb-1",
      4: "text-sm font-medium mt-2 mb-1",
    };
    const Tag = `h${Math.min(level + 1, 6)}` as keyof React.JSX.IntrinsicElements;
    return (
      <Tag key={index} className={classes[level] || classes[4]}>
        {renderInline(text)}
      </Tag>
    );
  }

  // List block (consecutive lines starting with - or *)
  const lines = trimmed.split("\n");
  const isListBlock = lines.every(
    (l) => l.match(/^\s*[-*]\s/) || l.trim() === ""
  );
  if (isListBlock) {
    const items = lines.filter((l) => l.match(/^\s*[-*]\s/));
    return (
      <ul key={index} className="list-disc pl-5 space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item.replace(/^\s*[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }

  // Regular paragraph
  return (
    <p key={index}>{renderInline(trimmed)}</p>
  );
}

export function MarkdownContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  // Split on double newlines (paragraphs) or before headers
  const blocks = content
    .split(/\n{2,}|(?=\n#{1,4}\s)/)
    .filter((b) => b.trim());

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
