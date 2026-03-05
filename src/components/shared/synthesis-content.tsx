"use client";

/** Rendu léger du markdown de la synthèse (gras, bullets, paragraphes) */
export function SynthesisContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((para, i) => {
        const lines = para.split("\n");
        const isBulletList = lines.every((l) => l.startsWith("- ") || l.trim() === "");

        if (isBulletList) {
          return (
            <ul key={i} className="list-disc list-inside space-y-0.5">
              {lines
                .filter((l) => l.startsWith("- "))
                .map((l, j) => (
                  <li key={j}>
                    <InlineBold text={l.slice(2)} />
                  </li>
                ))}
            </ul>
          );
        }

        return (
          <div key={i}>
            {lines.map((line, j) => {
              if (line.startsWith("- ")) {
                return (
                  <div key={j} className="flex gap-1.5 ml-1">
                    <span className="text-muted-foreground">•</span>
                    <span><InlineBold text={line.slice(2)} /></span>
                  </div>
                );
              }
              return (
                <p key={j}>
                  <InlineBold text={line} />
                </p>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/** Parse **bold** dans une ligne de texte */
function InlineBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
