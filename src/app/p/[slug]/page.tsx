import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChurchIcon, ExternalLink, MapPin, Package } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { Badge, Card, LinkButton } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { DENOMINATION_LABELS } from "@/lib/validation";
import {
  DIGITAL_PRODUCT_TYPE_LABEL,
  type ChurchBranch,
  type Product,
  type ProductCategory,
  type Seller,
} from "@/lib/supabase/types";
import { BranchPickerForm } from "./BranchPickerForm";

export const dynamic = "force-dynamic";

type PickupBranch = Pick<
  ChurchBranch,
  "id" | "denomination" | "branch_name" | "city" | "state" | "operating_days" | "operating_hours"
>;

type LoadedProduct = Product & {
  seller: Pick<Seller, "id" | "business_name" | "slug" | "status" | "logo_url"> | null;
  category: Pick<ProductCategory, "name" | "slug"> | null;
  pickups: { branch: PickupBranch | null }[];
};

export default async function PublicProductPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      `*,
       seller:sellers ( id, business_name, slug, status, logo_url ),
       category:product_categories ( name, slug ),
       pickups:product_pickup_locations (
         branch:church_branches ( id, denomination, branch_name, city, state, operating_days, operating_hours )
       )`
    )
    .eq("slug", params.slug)
    .maybeSingle<LoadedProduct>();

  if (!product || !product.available || !product.seller || product.seller.status !== "VERIFIED") {
    notFound();
  }

  const pickups = product.pickups.map((p) => p.branch).filter((b): b is PickupBranch => !!b);
  const canBuy = !!product.paystack_payment_url;
  const inStock = product.is_digital || product.inventory_qty > 0;

  const viewer = product.is_digital ? null : await getCurrentUser();
  const homeBranchId =
    viewer?.profile.role === "BUYER" ? viewer.profile.home_church_branch_id : null;
  const canBuyerOrderPickup = !product.is_digital && viewer?.profile.role === "BUYER";

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--cp-cream)]">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <nav className="mb-4 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          <Link
            href={product.is_digital ? "/" : "/marketplace"}
            className="hover:text-[color:var(--cp-gold)] hover:underline"
          >
            {product.is_digital ? "Church Potal" : "Marketplace"}
          </Link>
          {product.category && (
            <>
              {" / "}
              <span className="text-[color:var(--cp-cocoa-deep)]">{product.category.name}</span>
            </>
          )}
        </nav>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-[color:var(--cp-sand)]/40">
              {product.cover_image_url ? (
                <Image
                  src={product.cover_image_url}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-body-sm text-[color:var(--cp-sand-dark)]">
                  No cover image
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h1 className="text-h1 text-[color:var(--cp-cocoa-deep)]">{product.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-body-sm text-[color:var(--cp-cocoa-mid)]">
              <span className="font-editorial font-bold">{product.seller.business_name}</span>
              <Badge withIcon>Kingdom Verified</Badge>
            </div>
            <p className="mt-4 font-editorial text-3xl font-bold text-[color:var(--cp-cocoa-deep)]">
              {formatNaira(product.price_kobo)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.is_digital ? (
                <span
                  className="rounded-full px-2.5 py-0.5 text-tag"
                  style={{ background: "rgba(44,24,16,0.06)", color: "var(--cp-cocoa-mid)" }}
                >
                  {DIGITAL_PRODUCT_TYPE_LABEL[product.product_type]}
                </span>
              ) : (
                <span
                  className="rounded-full px-2.5 py-0.5 text-tag"
                  style={{ background: "rgba(44,24,16,0.06)", color: "var(--cp-cocoa-mid)" }}
                >
                  Physical product
                </span>
              )}
              {product.category && (
                <span className="rounded-full bg-[color:var(--cp-sand)] px-2.5 py-0.5 text-tag text-[color:var(--cp-cocoa-mid)]">
                  {product.category.name}
                </span>
              )}
              {product.is_digital ? (
                <span className="status-pill status-success">Instant digital delivery</span>
              ) : (
                <span
                  className={`status-pill ${inStock ? "status-success" : "status-failed"}`}
                >
                  {inStock ? `${product.inventory_qty} in stock` : "Sold out"}
                </span>
              )}
            </div>

            <p className="text-body mt-6 whitespace-pre-line text-[color:var(--cp-cocoa-deep)]">
              {product.description}
            </p>

            {/* Pickup locations for physical products */}
            {!product.is_digital && pickups.length > 0 && (
              <Card className="mt-6">
                <div className="flex items-center gap-2 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
                  <ChurchIcon size={16} className="text-[color:var(--cp-gold)]" /> Pickup at a
                  church near you
                </div>
                <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                  Choose any of these branches at checkout. No home address needed.
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {pickups.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-lg border border-[color:var(--cp-rule)] bg-[color:var(--cp-cream)] p-3 text-body-sm"
                    >
                      <p className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                        {DENOMINATION_LABELS[b.denomination]} — {b.branch_name}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                        <MapPin size={11} /> {b.city}, {b.state}
                      </p>
                      <p className="mt-0.5 text-mono text-[color:var(--cp-mid)]">
                        {b.operating_days} · {b.operating_hours}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {!product.is_digital && pickups.length === 0 && (
              <div
                className="mt-6 rounded-xl border p-4 text-body-sm"
                style={{
                  background: "var(--cp-sand)",
                  borderColor: "var(--cp-sand-dark)",
                  color: "var(--cp-cocoa-deep)",
                }}
              >
                <div className="flex items-center gap-2 font-editorial font-bold">
                  <Package size={14} /> No pickup locations
                </div>
                <p className="mt-1 text-tag">
                  This seller hasn't picked any pickup churches yet — please check back soon.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {canBuyerOrderPickup && inStock && pickups.length > 0 && (
                <BranchPickerForm
                  productId={product.id}
                  branches={pickups}
                  defaultBranchId={homeBranchId}
                />
              )}

              {!product.is_digital && !viewer && pickups.length > 0 && inStock && (
                <LinkButton
                  href={`/login?next=/p/${product.slug}`}
                  size="lg"
                  className="w-full"
                >
                  Sign in to place a pickup order
                </LinkButton>
              )}

              {product.is_digital && canBuy && inStock && (
                <a
                  href={product.paystack_payment_url!}
                  target="_blank"
                  rel="noopener"
                  className="btn-primary cp-btn-lg w-full"
                >
                  Buy now · {formatNaira(product.price_kobo)}
                  <ExternalLink size={16} />
                </a>
              )}

              {!inStock && (
                <button type="button" disabled className="btn-secondary cp-btn-lg w-full">
                  Sold out
                </button>
              )}

              {product.is_digital && !canBuy && (
                <button type="button" disabled className="btn-secondary cp-btn-lg w-full">
                  Not available for purchase
                </button>
              )}

              <p className="text-caption text-[color:var(--cp-cocoa-mid)]">
                Payment is processed by{" "}
                <a
                  href="https://paystack.com"
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-[color:var(--cp-gold)] hover:underline"
                >
                  Paystack
                </a>{" "}
                in Nigerian Naira.{" "}
                {product.is_digital
                  ? "You'll receive access instructions from the seller after paying."
                  : "After paying, present your receipt at your chosen pickup branch."}
              </p>
            </div>

            <Card variant="surface" className="mt-6">
              <div className="flex items-center gap-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                <ChurchIcon size={14} className="text-[color:var(--cp-gold)]" /> Christian creator
              </div>
              <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">
                Church Potal is a marketplace for Nigerian Christian sellers. Every seller is
                Kingdom Verified before they can list products.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
