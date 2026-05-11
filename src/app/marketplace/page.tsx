import Image from "next/image";
import Link from "next/link";
import { ChurchIcon, MapPin, Package, ShoppingBag } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, LinkButton } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { DENOMINATIONS, DENOMINATION_LABELS } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type {
  ChurchBranch,
  Denomination,
  Product,
  ProductCategory,
  Seller,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Buyers think in terms of "Lagos" and "Abuja" — which match Lagos State and
// the FCT respectively (Lekki, Wuse, etc. all roll up). So we filter on
// `state`, not `city`, but keep the friendly labels.
const CITY_FILTERS: { label: string; value: string | null }[] = [
  { label: "All cities", value: null },
  { label: "Lagos", value: "Lagos" },
  { label: "Abuja", value: "FCT" },
];

type SearchParams = { denom?: string; city?: string };

type RawProduct = Pick<
  Product,
  "id" | "slug" | "title" | "price_kobo" | "cover_image_url" | "category_id"
> & {
  seller: Pick<Seller, "business_name" | "slug"> | null;
  pickups: { branch: Pick<ChurchBranch, "id" | "denomination" | "branch_name" | "city" | "state"> | null }[];
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createSupabaseServerClient();

  const denom = isDenomination(searchParams.denom) ? searchParams.denom : null;
  const city = CITY_FILTERS.find((c) => c.value === searchParams.city) ?? CITY_FILTERS[0];

  const [{ data: rawProducts }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `id, slug, title, price_kobo, cover_image_url, category_id,
         seller:sellers ( business_name, slug ),
         pickups:product_pickup_locations (
           branch:church_branches ( id, denomination, branch_name, city, state )
         )`
      )
      .eq("is_digital", false)
      .eq("available", true)
      .order("created_at", { ascending: false })
      .returns<RawProduct[]>(),
    supabase
      .from("product_categories")
      .select("id, name, slug, active")
      .eq("active", true)
      .returns<ProductCategory[]>(),
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const products = (rawProducts ?? [])
    .map((p) => ({
      ...p,
      pickups: p.pickups.map((row) => row.branch).filter((b): b is NonNullable<typeof b> => !!b),
    }))
    .filter((p) => p.seller && p.pickups.length > 0)
    .filter((p) => {
      if (!denom && !city.value) return true;
      return p.pickups.some(
        (b) =>
          (!denom || b.denomination === denom) &&
          (!city.value || b.state === city.value)
      );
    });

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--cp-cream)]">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <header className="mb-6 flex flex-col gap-1 border-b border-[color:var(--cp-rule)] pb-4">
          <p className="text-label text-[color:var(--cp-cocoa-mid)]">Marketplace</p>
          <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">Physical goods</h1>
          <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
            Browse products from Kingdom-verified Christian sellers — picked up at a church near you.
          </p>
        </header>

        <Filters denom={denom} city={city.value} />

        {products.length === 0 ? (
          <Card className="mt-8 text-center">
            <Package className="mx-auto h-8 w-8 text-[color:var(--cp-sand-dark)]" />
            <p className="mt-2 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
              Nothing matches that filter
            </p>
            <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
              Try a different denomination or city, or clear the filters.
            </p>
            <LinkButton href="/marketplace" variant="secondary" size="sm" className="mt-4">
              Clear filters
            </LinkButton>
          </Card>
        ) : (
          <>
            <p className="mb-3 mt-6 text-tag text-[color:var(--cp-cocoa-mid)]">
              {products.length} product{products.length === 1 ? "" : "s"} found
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/p/${p.slug}`}
                    className="group card card-interactive flex h-full flex-col overflow-hidden !p-0"
                  >
                    <div className="relative aspect-[4/3] bg-[color:var(--cp-sand)]/40">
                      {p.cover_image_url ? (
                        <Image
                          src={p.cover_image_url}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform group-hover:scale-[1.01]"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-[color:var(--cp-sand-dark)]">
                          <ShoppingBag size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="line-clamp-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)] group-hover:text-[color:var(--cp-cocoa-mid)]">
                        {p.title}
                      </p>
                      {p.seller && (
                        <p className="truncate text-tag text-[color:var(--cp-cocoa-mid)]">
                          {p.seller.business_name}
                        </p>
                      )}
                      <p className="mt-1 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
                        {formatNaira(p.price_kobo)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.category_id && categoryMap.has(p.category_id) && (
                          <span className="rounded-full bg-[color:var(--cp-sand)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--cp-cocoa-mid)]">
                            {categoryMap.get(p.category_id)}
                          </span>
                        )}
                        {dedupeDenoms(p.pickups).map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--cp-cocoa-deep)]/8 px-2 py-0.5 text-[10px] font-medium text-[color:var(--cp-cocoa-mid)]"
                            style={{ background: "rgba(44,24,16,0.06)" }}
                          >
                            <ChurchIcon size={9} /> {DENOMINATION_LABELS[d]}
                          </span>
                        ))}
                        {dedupeStates(p.pickups)
                          .slice(0, 2)
                          .map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: "rgba(219,164,74,0.2)", color: "var(--cp-cocoa-mid)" }}
                            >
                              <MapPin size={9} /> {stateLabel(s)}
                            </span>
                          ))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function Filters({ denom, city }: { denom: Denomination | null; city: string | null }) {
  return (
    <section className="flex flex-col gap-4">
      <FilterRow label="City">
        {CITY_FILTERS.map((c) => (
          <FilterChip
            key={c.label}
            label={c.label}
            href={buildHref({ denom, city: c.value })}
            active={(c.value ?? null) === (city ?? null)}
          />
        ))}
      </FilterRow>
      <FilterRow label="Denomination">
        <FilterChip label="All" href={buildHref({ denom: null, city })} active={!denom} />
        {DENOMINATIONS.map((d) => (
          <FilterChip
            key={d}
            label={DENOMINATION_LABELS[d]}
            href={buildHref({ denom: d, city })}
            active={denom === d}
          />
        ))}
      </FilterRow>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-24 shrink-0 text-label text-[color:var(--cp-cocoa-mid)]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 font-ui text-tag transition-colors",
        active
          ? "border-[color:var(--cp-gold)] bg-[color:var(--cp-gold)] text-[color:var(--cp-cocoa-deep)]"
          : "border-[color:var(--cp-rule)] bg-white text-[color:var(--cp-cocoa-mid)] hover:border-[color:var(--cp-gold)]"
      )}
    >
      {label}
    </Link>
  );
}

function buildHref({ denom, city }: { denom: Denomination | null; city: string | null }) {
  const params = new URLSearchParams();
  if (denom) params.set("denom", denom);
  if (city) params.set("city", city);
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

function dedupeDenoms(
  branches: Pick<ChurchBranch, "denomination">[]
): Denomination[] {
  return Array.from(new Set(branches.map((b) => b.denomination)));
}

function dedupeStates(branches: Pick<ChurchBranch, "state">[]): string[] {
  return Array.from(new Set(branches.map((b) => b.state)));
}

function stateLabel(state: string): string {
  if (state === "FCT") return "Abuja";
  return state;
}

function isDenomination(v: string | undefined): v is Denomination {
  if (!v) return false;
  return (DENOMINATIONS as readonly string[]).includes(v);
}
