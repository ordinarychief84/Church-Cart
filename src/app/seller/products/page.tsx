import Image from "next/image";
import { Plus, Boxes } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, LinkButton, StatusPill } from "@/components/ui";
import { formatNaira } from "@/lib/format";
import { DIGITAL_PRODUCT_TYPE_LABEL, type Product, type Seller } from "@/lib/supabase/types";
import { ProductRowActions } from "./ProductRowActions";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id" | "status">>();

  if (!seller) {
    return <Empty title="Set up your store first" cta="Go to settings" href="/seller/settings" />;
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, slug, title, price_kobo, available, product_type, cover_image_url, paystack_payment_url, created_at"
    )
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false })
    .returns<
      Pick<
        Product,
        | "id"
        | "slug"
        | "title"
        | "price_kobo"
        | "available"
        | "product_type"
        | "cover_image_url"
        | "paystack_payment_url"
        | "created_at"
      >[]
    >();

  const list = products ?? [];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between border-b border-[color:var(--cp-rule)] pb-4">
        <div>
          <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
          <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">Products</h1>
          <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            {list.length} listed · digital downloads sold via your Paystack payment link
          </p>
        </div>
        {seller.status === "VERIFIED" && (
          <LinkButton href="/seller/products/new" leadingIcon={<Plus size={16} />}>
            New product
          </LinkButton>
        )}
      </header>

      {seller.status !== "VERIFIED" && (
        <div
          className="mb-4 rounded-xl border p-4 text-body-sm"
          style={{
            background: "var(--cp-sand)",
            borderColor: "var(--cp-sand-dark)",
            color: "var(--cp-cocoa-deep)",
          }}
        >
          Your store is <strong>{seller.status.toLowerCase()}</strong>. You can list products once
          we approve your store.
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          title="No products yet"
          subtitle="List your first digital product and start selling to the Church Potal community."
          cta={seller.status === "VERIFIED" ? "Add a product" : "Wait for verification"}
          href={seller.status === "VERIFIED" ? "/seller/products/new" : "/seller/settings"}
        />
      ) : (
        <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-3">
              <div className="flex min-w-0 items-center gap-3">
                {p.cover_image_url ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[color:var(--cp-sand)]">
                    <Image src={p.cover_image_url} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[color:var(--cp-sand)] text-[color:var(--cp-sand-dark)]">
                    <Boxes size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <a
                    href={`/seller/products/${p.id}/edit`}
                    className="block truncate font-editorial font-bold text-[color:var(--cp-cocoa-deep)] hover:underline"
                  >
                    {p.title}
                  </a>
                  <p className="text-tag text-[color:var(--cp-cocoa-mid)]">
                    {DIGITAL_PRODUCT_TYPE_LABEL[p.product_type]} · /p/{p.slug}
                  </p>
                  {!p.paystack_payment_url && (
                    <p className="mt-0.5 text-tag text-[color:var(--cp-error)]">
                      Missing Paystack link — buyers can't pay yet
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                  {formatNaira(p.price_kobo)}
                </span>
                <StatusPill tone={p.available ? "success" : "pending"}>
                  {p.available ? "Live" : "Hidden"}
                </StatusPill>
                <ProductRowActions
                  productId={p.id}
                  slug={p.slug}
                  available={p.available}
                  hasPaystackUrl={!!p.paystack_payment_url}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({
  title,
  subtitle,
  cta,
  href,
}: {
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="text-center">
      <Boxes className="mx-auto h-8 w-8 text-[color:var(--cp-sand-dark)]" />
      <p className="mt-3 font-editorial text-base font-bold text-[color:var(--cp-cocoa-deep)]">
        {title}
      </p>
      {subtitle && (
        <p className="mx-auto mt-1 max-w-md text-body-sm text-[color:var(--cp-cocoa-mid)]">
          {subtitle}
        </p>
      )}
      <LinkButton href={href} className="mt-4">
        {cta} →
      </LinkButton>
    </Card>
  );
}
