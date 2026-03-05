import { Database } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2 font-bold text-lg">
          <Database className="h-5 w-5 text-primary" />
          <span>Le 49.3</span>
        </a>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">
            Recherche
          </a>
          <a
            href="https://www.data.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            data.gouv.fr
          </a>
        </nav>
      </div>
    </header>
  );
}
