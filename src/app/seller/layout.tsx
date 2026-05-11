import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Seller } from "@/lib/supabase/types";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { NotificationsBell } from "@/components/NotificationsBell";
import { LogoLockup } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("slug, status, business_name")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "slug" | "status" | "business_name">>();

  return (
    <div className="min-h-screen bg-[color:var(--cp-cream)]">
      <header className="border-b border-[color:var(--cp-rule)] bg-[color:var(--cp-cocoa-deep)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <LogoLockup variant="dark" size="sm" />
          <div className="flex items-center gap-3 font-ui text-sm text-white/80">
            <NotificationsBell userId={user.id} />
            <Link
              href="/account"
              className="hidden transition-colors hover:text-[color:var(--cp-gold)] sm:inline"
            >
              Account
            </Link>
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-1 transition-colors hover:text-[color:var(--cp-gold)]">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <SellerSidebar
          businessName={seller?.business_name ?? user.profile.full_name}
          status={seller?.status ?? null}
          slug={seller?.slug ?? null}
        />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
