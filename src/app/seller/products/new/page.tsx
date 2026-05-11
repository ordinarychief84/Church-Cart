import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ChurchBranch, ProductCategory, Seller } from "@/lib/supabase/types";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id" | "status">>();
  if (!seller) redirect("/seller/settings");
  if (seller.status !== "VERIFIED") redirect("/seller/products");

  const [{ data: categories }, { data: branches }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("*")
      .eq("active", true)
      .order("name")
      .returns<ProductCategory[]>(),
    supabase
      .from("church_branches")
      .select("id, denomination, branch_name, city, state")
      .eq("status", "APPROVED")
      .order("denomination")
      .returns<
        Pick<ChurchBranch, "id" | "denomination" | "branch_name" | "city" | "state">[]
      >(),
  ]);

  return (
    <div>
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">New product</h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          List a physical good (with church pickup) or a digital download (with a Paystack link).
        </p>
      </header>
      <ProductForm
        mode="create"
        categories={categories ?? []}
        branches={branches ?? []}
        initialPickupBranchIds={[]}
      />
    </div>
  );
}
