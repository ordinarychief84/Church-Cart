import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  Clock,
  ExternalLink,
  Package,
  Plus,
  ShieldCheck,
  ShieldX,
  Store,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, LinkButton, OrderStatusPill } from "@/components/ui";
import { formatDate, formatNaira } from "@/lib/format";
import {
  DIGITAL_PRODUCT_TYPE_LABEL,
  type Order,
  type Product,
  type Profile,
  type Seller,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function SellerHome() {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Seller>();

  if (!seller) return <SetupCallout name={user.profile.full_name} />;

  const [{ count: productCount }, { count: liveCount }, { data: latest }, ordersResp] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", seller.id),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", seller.id)
        .eq("available", true)
        .not("paystack_payment_url", "is", null),
      supabase
        .from("products")
        .select(
          "id, slug, title, price_kobo, available, product_type, paystack_payment_url, created_at"
        )
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<
          Pick<
            Product,
            | "id"
            | "slug"
            | "title"
            | "price_kobo"
            | "available"
            | "product_type"
            | "paystack_payment_url"
            | "created_at"
          >[]
        >(),
      supabase
        .from("orders")
        .select(
          `id, status, total_kobo, created_at,
           buyer:profiles ( full_name )`
        )
        .eq("seller_id", seller.id)
        .in("status", ["PAID", "PROCESSING", "SHIPPED"] as unknown as string[])
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<
          (Pick<Order, "id" | "status" | "total_kobo" | "created_at"> & {
            buyer: Pick<Profile, "full_name"> | null;
          })[]
        >(),
    ]);
  const incoming = ordersResp.data ?? [];
  const actionable = incoming.filter((o) => o.status === "PAID").length;

  const missingLinks =
    (latest ?? []).filter((p) => p.available && !p.paystack_payment_url).length;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 border-b border-[color:var(--cp-rule)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
          <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">
            {seller.business_name}
          </h1>
          <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
            Welcome back, {user.profile.full_name.split(" ")[0]}.
          </p>
        </div>
        {seller.status === "VERIFIED" && (
          <LinkButton href="/seller/products/new" leadingIcon={<Plus size={16} />}>
            New product
          </LinkButton>
        )}
      </header>

      <StatusBanner status={seller.status} reason={seller.rejection_reason} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Products" value={productCount ?? 0} icon={<Boxes />} href="/seller/products" />
        <Stat
          label="Ready to sell"
          value={liveCount ?? 0}
          hint="Live + has a Paystack link"
          icon={<Wallet />}
          tone={liveCount && liveCount > 0 ? "success" : "muted"}
        />
        <Stat
          label="Open orders"
          value={incoming.length}
          hint={actionable > 0 ? `${actionable} need attention` : "All on track"}
          icon={<Package />}
          tone={actionable > 0 ? "warn" : "muted"}
          href="/seller/orders"
        />
        <Stat
          label="Missing Paystack link"
          value={missingLinks}
          hint={missingLinks > 0 ? "Buyers can't pay" : "All set"}
          icon={<AlertTriangle />}
          tone={missingLinks > 0 ? "warn" : "muted"}
          href="/seller/products"
        />
      </div>

      {incoming.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">Incoming orders</h2>
            <Link
              href="/seller/orders"
              className="text-tag text-[color:var(--cp-gold)] hover:underline"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
            {incoming.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/seller/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm hover:bg-[color:var(--cp-cream)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      {o.buyer?.full_name ?? "Member"} ·{" "}
                      <span className="text-mono">#{o.id.slice(-6).toUpperCase()}</span>
                    </p>
                    <p className="text-tag text-[color:var(--cp-cocoa-mid)]">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                      {formatNaira(o.total_kobo)}
                    </span>
                    <OrderStatusPill status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-h2 text-[color:var(--cp-cocoa-deep)]">Latest products</h2>
          <Link
            href="/seller/products"
            className="text-tag text-[color:var(--cp-gold)] hover:underline"
          >
            View all →
          </Link>
        </div>
        {!latest || latest.length === 0 ? (
          <Card className="text-center">
            <Boxes className="mx-auto h-7 w-7 text-[color:var(--cp-sand-dark)]" />
            <p className="mt-2 font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
              No products listed yet
            </p>
            <p className="text-body-sm text-[color:var(--cp-cocoa-mid)]">
              List your first digital product to start selling.
            </p>
            {seller.status === "VERIFIED" && (
              <LinkButton
                href="/seller/products/new"
                size="sm"
                leadingIcon={<Plus size={14} />}
                className="mt-3"
              >
                Add product
              </LinkButton>
            )}
          </Card>
        ) : (
          <ul className="divide-y divide-[color:var(--cp-rule)] overflow-hidden rounded-xl border border-[color:var(--cp-rule)] bg-white">
            {latest.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/seller/products/${p.id}/edit`}
                    className="block truncate font-editorial font-bold text-[color:var(--cp-cocoa-deep)] hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="truncate text-tag text-[color:var(--cp-cocoa-mid)]">
                    {DIGITAL_PRODUCT_TYPE_LABEL[p.product_type]} · /p/{p.slug}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-editorial font-bold text-[color:var(--cp-cocoa-deep)]">
                    {formatNaira(p.price_kobo)}
                  </span>
                  {p.available && p.paystack_payment_url ? (
                    <Link
                      href={`/p/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-tag text-[color:var(--cp-gold)] hover:underline"
                    >
                      <ExternalLink size={12} /> View
                    </Link>
                  ) : (
                    <span className="status-pill status-pending">Needs setup</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SetupCallout({ name }: { name: string }) {
  return (
    <div>
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">
          Welcome, {name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Let's get your store set up.
        </p>
      </header>
      <Card variant="surface" className="text-[color:var(--cp-cocoa-deep)]">
        <Store className="text-[color:var(--cp-gold)]" />
        <p className="mt-2 font-editorial text-base font-bold">Set up your store profile</p>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Tell members about your business. We review every new store before approving it for sale —
          usually within 24 hours.
        </p>
        <LinkButton href="/seller/settings" className="mt-4">
          Set up store →
        </LinkButton>
      </Card>
    </div>
  );
}

function StatusBanner({
  status,
  reason,
}: {
  status: Seller["status"];
  reason: string | null;
}) {
  if (status === "VERIFIED") {
    return (
      <Banner
        tone="success"
        icon={<ShieldCheck />}
        title="Kingdom Verified"
        body="Your store is live. Products with a Paystack link show up on your public page."
      />
    );
  }
  if (status === "PENDING") {
    return (
      <Banner
        tone="pending"
        icon={<Clock />}
        title="Awaiting Kingdom verification"
        body="A platform admin is reviewing your store. You can list products once approved."
      />
    );
  }
  return (
    <Banner
      tone="failed"
      icon={<ShieldX />}
      title="Application not approved"
      body={reason ?? "Update your store details on the settings page and re-submit for review."}
    />
  );
}

function Banner({
  tone,
  icon,
  title,
  body,
}: {
  tone: "pending" | "success" | "failed";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    pending: { background: "var(--cp-sand)", borderColor: "var(--cp-sand-dark)", color: "var(--cp-cocoa-deep)" },
    success: { background: "#E0F0E7", borderColor: "rgba(45,122,79,0.4)", color: "#1A5C32" },
    failed: { background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" },
  } as const;
  return (
    <div
      className="flex items-start gap-3 rounded-xl border p-4 text-body-sm"
      style={styles[tone]}
    >
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-editorial font-bold">{title}</p>
        <p>{body}</p>
      </div>
    </div>
  );
}

type StatTone = "brand" | "success" | "warn" | "muted";

function Stat({
  label,
  value,
  hint,
  icon,
  href,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
  tone?: StatTone;
}) {
  const TONE: Record<StatTone, string> = {
    brand: "bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]",
    success: "text-[color:var(--cp-success)]",
    warn: "bg-[color:var(--cp-gold)]/15 text-[color:var(--cp-cocoa-mid)]",
    muted: "bg-[color:var(--cp-sand)] text-[color:var(--cp-mid)]",
  };
  const inner = (
    <Card interactive={!!href}>
      <div className="flex items-start justify-between">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">{label}</p>
        <div className={`grid h-8 w-8 place-items-center rounded-md ${TONE[tone]}`}>{icon}</div>
      </div>
      <p className="mt-2 font-editorial text-2xl font-bold text-[color:var(--cp-cocoa-deep)]">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-tag text-[color:var(--cp-cocoa-mid)]">{hint}</p>
      )}
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
