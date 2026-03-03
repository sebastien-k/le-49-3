import Link from "next/link";
import { FileText, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Dataset } from "@/types/dataset";

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <Link href={`/datasets/${dataset.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-base line-clamp-2">
            {dataset.title}
          </h3>

          {dataset.organization && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{dataset.organization}</span>
            </div>
          )}

          {dataset.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {dataset.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-1.5">
              {dataset.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {dataset.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{dataset.tags.length - 4}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
              <FileText className="h-3.5 w-3.5" />
              <span>{dataset.resourceCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
