import Link from "next/link";
import { cn } from "@/lib/utils";

type Cat = { id: string; slug: string; name: string };

export function CategoryChips({ categories, active }: { categories: Cat[]; active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/marketplace"
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium",
          !active
            ? "border-brand-700 bg-brand-700 text-white"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/marketplace?cat=${c.slug}`}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            active === c.slug
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
