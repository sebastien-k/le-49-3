"use client";

import { Database } from "lucide-react";
import { ByokCard } from "@/components/shared/byok-card";
import { AskMode } from "@/components/ask/ask-mode";
import { SearchMode } from "@/components/search/search-mode";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Database className="h-10 w-10" style={{ color: "#000091" }} />
          <h1 className="text-4xl font-bold" style={{ color: "#000091" }}>Le 49.3</h1>
        </div>
        <p className="text-lg" style={{ color: "#000091" }}>
          L&apos;explorateur des donn&eacute;es ouvertes de la R&eacute;publique fran&ccedil;aise
        </p>
        <p className="text-base font-medium mt-3" style={{ color: "#000091" }}>
          Parce que vos requ&ecirc;tes n&apos;ont pas besoin de majorit&eacute;.
        </p>
        <p className="text-sm italic mt-1" style={{ color: "#000091", opacity: 0.7 }}>
          Le 49.3 vous y donne acc&egrave;s sans passer par la proc&eacute;dure parlementaire.
        </p>
      </div>

      {/* BYOK — Clé API */}
      <div className="mb-8">
        <ByokCard />
      </div>

      {/* Séparateur Ask */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#000091" }}>
          Interroger les donn&eacute;es
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Ask — question en langage naturel */}
      <AskMode />

      {/* Séparateur */}
      <div className="flex items-center gap-4 my-8">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#000091" }}>
          Explorer par th&egrave;me
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Recherche et découverte */}
      <SearchMode />
    </div>
  );
}
