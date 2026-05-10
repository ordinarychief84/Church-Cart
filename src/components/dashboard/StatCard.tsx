import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Tone = "brand" | "gold" | "emerald" | "amber" | "red" | "slate";

const TONE_BG: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold-100 text-gold-800",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "brand",
  delta,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: Tone;
  delta?: { direction: "up" | "down" | "flat"; label: string };
}) {
  const inner = (
    <CardBody className="flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && (
          <div
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md",
              TONE_BG[tone]
            )}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold leading-none text-slate-900">{value}</p>
      <div className="flex items-center justify-between gap-2">
        {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta.direction === "up" && "text-emerald-700",
              delta.direction === "down" && "text-red-700",
              delta.direction === "flat" && "text-slate-500"
            )}
          >
            {delta.direction === "up" && <TrendingUp size={12} />}
            {delta.direction === "down" && <TrendingDown size={12} />}
            {delta.label}
          </span>
        )}
      </div>
    </CardBody>
  );
  if (href) {
    return (
      <Link href={href} className="group block">
        <Card className="relative transition-colors group-hover:border-brand-400">
          {inner}
          <ArrowUpRight
            size={14}
            className="absolute right-2 top-2 text-slate-300 transition-colors group-hover:text-brand-600"
          />
        </Card>
      </Link>
    );
  }
  return <Card>{inner}</Card>;
}
