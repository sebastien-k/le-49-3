import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-bold">404 — Article non trouvé</h2>
      <p className="text-muted-foreground">
        Cette page n&apos;existe pas dans les archives de la République.
      </p>
      <Link href="/">
        <Button>Retour à la recherche</Button>
      </Link>
    </div>
  );
}
