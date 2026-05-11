import { notFound } from "next/navigation";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ChurchBranch,
  Product,
  ProductCategory,
  ProductPickupLocation,
  Seller,
} from "@/lib/supabase/types";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id">>();
  if (!seller) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", seller.id)
    .maybeSingle<Product>();
  if (!product) notFound();

  const [{ data: categories }, { data: branches }, { data: pickupLinks }] = await Promise.all([
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
    supabase
      .from("product_pickup_locations")
      .select("branch_id")
      .eq("product_id", product.id)
      .returns<Pick<ProductPickupLocation, "branch_id">[]>(),
  ]);

  return (
    <div>
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Seller</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">Edit product</h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">{product.title}</p>
      </header>
      <ProductForm
        mode="edit"
        product={product}
        categories={categories ?? []}
        branches={branches ?? []}
        initialPickupBranchIds={(pickupLinks ?? []).map((p) => p.branch_id)}
      />
    </div>
  );
}
