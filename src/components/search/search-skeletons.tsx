import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DatasetCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Organization */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {/* Tags + resource count */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DataserviceCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Title with icon */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 mt-1 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        {/* Organization */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        {/* URL */}
        <Skeleton className="h-3 w-48" />
        {/* Tags */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResultsSkeleton({ count = 5, type = "datasets" }: { count?: number; type?: "datasets" | "dataservices" }) {
  const CardSkeleton = type === "datasets" ? DatasetCardSkeleton : DataserviceCardSkeleton;
  return (
    <>
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}
