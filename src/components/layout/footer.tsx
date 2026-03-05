export function Footer() {
  return (
    <footer className="border-t bg-card py-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground/60">
          La République produit des données. Beaucoup de données.
          Météo-France surveille le ciel,
          l&apos;IGN cartographie chaque parcelle, le ministère de l&apos;Intérieur
          recense chaque scrutin, la DGCCRF traque la teneur en beurre des croissants,
          l&apos;ADEME pèse vos poubelles, le CEREMA mesure la rugosité des routes départementales,
          la SNCF comptabilise ses minutes de retard, l&apos;ONF dénombre les chevreuils,
          et l&apos;INSEE tient à jour la liste des prénoms donnés à Montcuq.
          Tout est là, en accès libre.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Le 49.3 — Propulsé par le{" "}
          <a
            href="https://github.com/datagouv/datagouv-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            MCP data.gouv.fr
          </a>{" "}
          — Créé par{" "}
          <a
            href="https://bsky.app/profile/sebastienk.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Sébastien Kohn
          </a>
        </p>
      </div>
    </footer>
  );
}
