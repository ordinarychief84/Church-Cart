import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Seller } from "@/lib/supabase/types";
import { SellerProfileForm } from "./SellerProfileForm";

export const dynamic = "force-dynamic";

export default async function SellerSettingsPage() {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Seller>();

  return (
    <div>
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">Store settings</h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Tell members about your business. We review every new store before approval.
        </p>
      </header>

      {!seller && (
        <Banner
          tone="sand"
          title="Welcome to Church Potal"
          body="Fill in your store details — most stores are reviewed within 24 hours. You can edit anytime."
        />
      )}
      {seller?.status === "PENDING" && (
        <Banner
          tone="pending"
          icon={<Clock />}
          title="Awaiting Kingdom verification"
          body="Your store details are with our review team. We'll email you when you're cleared to list products."
        />
      )}
      {seller?.status === "VERIFIED" && (
        <Banner
          tone="success"
          icon={<ShieldCheck />}
          title="Kingdom Verified"
          body="Your store is live. Anything you list here shows up on the marketplace immediately."
        />
      )}
      {seller?.status === "REJECTED" && (
        <Banner
          tone="failed"
          icon={<ShieldX />}
          title="Application not approved"
          body={seller.rejection_reason ?? "Update your details below and we'll review again."}
        />
      )}

      <div className="mt-6">
        <SellerProfileForm initial={seller} userName={user.profile.full_name} />
      </div>
    </div>
  );
}

function Banner({
  tone,
  icon,
  title,
  body,
}: {
  tone: "sand" | "pending" | "success" | "failed";
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    sand: {
      background: "var(--cp-sand)",
      borderColor: "var(--cp-sand-dark)",
      color: "var(--cp-cocoa-deep)",
    },
    pending: {
      background: "rgba(219,164,74,0.2)",
      borderColor: "rgba(219,164,74,0.5)",
      color: "var(--cp-cocoa-deep)",
    },
    success: { background: "#E0F0E7", borderColor: "rgba(45,122,79,0.4)", color: "#1A5C32" },
    failed: { background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" },
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 text-body-sm" style={styles[tone]}>
      {icon && <div className="mt-0.5">{icon}</div>}
      <div>
        <p className="font-editorial font-bold">{title}</p>
        <p>{body}</p>
      </div>
    </div>
  );
}
