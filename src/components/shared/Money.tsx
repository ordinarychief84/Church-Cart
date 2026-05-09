import { formatNaira } from "@/lib/format";

export function Money({ kobo, className }: { kobo: number; className?: string }) {
  return <span className={className}>{formatNaira(kobo)}</span>;
}
