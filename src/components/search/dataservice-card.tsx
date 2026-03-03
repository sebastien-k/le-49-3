import Link from "next/link";
import { Globe, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DataService } from "@/types/dataset";

export function DataserviceCard({ dataservice }: { dataservice: DataService }) {
  return (
    <Link href={`/dataservices/${dataservice.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-primary mt-1 shrink-0" />
            <h3 className="font-semibold text-base line-clamp-2">
              {dataservice.title}
            </h3>
          </div>

          {dataservice.organization && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{dataservice.organization}</span>
            </div>
          )}

          {dataservice.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {dataservice.description}
            </p>
          )}

          {dataservice.baseUrl && (
            <p className="text-xs font-mono text-muted-foreground mt-2 truncate">
              {dataservice.baseUrl}
            </p>
          )}

          {dataservice.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {dataservice.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
