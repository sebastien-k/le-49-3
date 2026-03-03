import { Badge } from "@/components/ui/badge";

const FORMAT_COLORS: Record<string, string> = {
  csv: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  json: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  jsonl: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  xlsx: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  xls: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  pdf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  xml: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  geojson: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  shp: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

export function FormatBadge({ format }: { format: string }) {
  const normalized = format.toLowerCase();
  const colorClass = FORMAT_COLORS[normalized] || "bg-muted text-muted-foreground";

  return (
    <Badge variant="secondary" className={`text-xs font-mono ${colorClass}`}>
      {format.toUpperCase()}
    </Badge>
  );
}
