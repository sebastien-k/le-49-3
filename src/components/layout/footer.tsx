export function Footer() {
  return (
    <footer className="border-t bg-card py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center text-sm text-muted-foreground">
        <p>
          Le 49.3 — Propulsé par le{" "}
          <a
            href="https://github.com/datagouv/datagouv-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            MCP data.gouv.fr
          </a>
          {" "}— Données ouvertes de la République française
        </p>
      </div>
    </footer>
  );
}
