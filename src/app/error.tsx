"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Le 49.3 a rencontré un blocage</h2>
      <p className="text-muted-foreground max-w-md">
        {error.message || "Une erreur inattendue est survenue."}
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
