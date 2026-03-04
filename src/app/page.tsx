"use client";

import { Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AskMode } from "@/components/ask/ask-mode";
import { SearchMode } from "@/components/search/search-mode";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Le 49.3</h1>
        </div>
        <p className="text-muted-foreground">
          L&apos;explorateur des donn&eacute;es ouvertes de la R&eacute;publique fran&ccedil;aise
        </p>
        <p className="text-sm text-muted-foreground/70 italic mt-1">
          Parce que vos requ&ecirc;tes n&apos;ont pas besoin de majorit&eacute;.
        </p>
      </div>

      {/* Tabs Question / Rechercher */}
      <Tabs defaultValue="ask" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="ask">Poser une question</TabsTrigger>
          <TabsTrigger value="search">Rechercher</TabsTrigger>
        </TabsList>

        <TabsContent value="ask">
          <AskMode />
        </TabsContent>

        <TabsContent value="search">
          <SearchMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
