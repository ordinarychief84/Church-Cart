"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/auth";
import { homeChurchSchema, placePickupOrderSchema } from "@/lib/validation";
import type { ChurchBranch, Order, Product } from "@/lib/supabase/types";

export type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

const PLATFORM_FEE_BPS = 500; // 5%
const CHURCH_PICKUP_FEE_KOBO = 80_000; // ₦800 flat

function generatePaystackReference() {
  // Naive mock — looks like a real Paystack ref so swap-in later is trivial.
  return "CP_MOCK_" + Math.random().toString(36).slice(2, 14).toUpperCase();
}

export async function setHomeChurchAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireRole("BUYER");
  const parsed = homeChurchSchema.safeParse({
    home_church_branch_id: formData.get("home_church_branch_id") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const supabase = createSupabaseServerClient();

  if (parsed.data.home_church_branch_id) {
    const { data: branch } = await supabase
      .from("church_branches")
      .select("id, status")
      .eq("id", parsed.data.home_church_branch_id)
      .maybeSingle<Pick<ChurchBranch, "id" | "status">>();
    if (!branch || branch.status !== "APPROVED") {
      return { error: "That branch isn't accepting pickups yet." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ home_church_branch_id: parsed.data.home_church_branch_id })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/buyer");
  return { ok: true };
}

/**
 * Buyer places an order for a physical product, choosing one of the product's
 * approved pickup branches. Lands in PENDING_PAYMENT with a Paystack reference.
 * A future iteration swaps the simulator for the real Paystack `/transaction/
 * initialize` call — the reference shape and order side-effects stay the same.
 */
export async function placeChurchPickupOrderAction(formData: FormData) {
  const user = await requireRole("BUYER");
  const parsed = placePickupOrderSchema.safeParse({
    product_id: formData.get("product_id"),
    branch_id: formData.get("branch_id"),
  });
  if (!parsed.success) redirect(`/buyer?error=invalid-order`);

  const supabase = createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, slug, seller_id, title, price_kobo, available, is_digital, inventory_qty"
    )
    .eq("id", parsed.data.product_id)
    .maybeSingle<
      Pick<
        Product,
        | "id"
        | "slug"
        | "seller_id"
        | "title"
        | "price_kobo"
        | "available"
        | "is_digital"
        | "inventory_qty"
      >
    >();
  if (!product || !product.available) redirect(`/buyer?error=product-unavailable`);
  if (product.is_digital) redirect(`/buyer?error=digital-not-pickup`);
  if (product.inventory_qty <= 0) redirect(`/buyer?error=out-of-stock`);

  const { data: link } = await supabase
    .from("product_pickup_locations")
    .select("branch_id")
    .eq("product_id", product.id)
    .eq("branch_id", parsed.data.branch_id)
    .maybeSingle();
  if (!link) redirect(`/buyer?error=branch-not-supported`);

  const subtotalKobo = product.price_kobo;
  const platformFeeKobo = Math.floor((subtotalKobo * PLATFORM_FEE_BPS) / 10_000);
  const logisticsFeeKobo = CHURCH_PICKUP_FEE_KOBO;
  const totalKobo = subtotalKobo + logisticsFeeKobo;
  const paystackReference = generatePaystackReference();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      seller_id: product.seller_id,
      delivery_type: "CHURCH_PICKUP",
      church_branch_id: parsed.data.branch_id,
      subtotal_kobo: subtotalKobo,
      platform_fee_kobo: platformFeeKobo,
      logistics_fee_kobo: logisticsFeeKobo,
      total_kobo: totalKobo,
      paystack_reference: paystackReference,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !order) redirect(`/buyer?error=could-not-place`);

  const { error: itemErr } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    title: product.title,
    price_kobo: product.price_kobo,
    quantity: 1,
  });
  if (itemErr) redirect(`/buyer?error=order-line-failed`);

  revalidatePath("/buyer");
  revalidatePath("/church");
  redirect(`/buyer/orders/${order.id}`);
}

/**
 * Mock Paystack callback. In production this is the webhook handler hit by
 * Paystack after a charge.success. For the simulator it's a server action
 * triggered by a "Simulate successful payment" button.
 */
export async function simulatePaystackPaymentAction(formData: FormData) {
  const user = await requireRole("BUYER");
  const orderId = formData.get("order_id");
  if (typeof orderId !== "string") redirect("/buyer?error=invalid-order");

  const supabase = createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, buyer_id")
    .eq("id", orderId)
    .maybeSingle<Pick<Order, "id" | "status" | "buyer_id">>();
  if (!order || order.buyer_id !== user.id) redirect("/buyer?error=order-not-found");
  if (order.status !== "PENDING_PAYMENT") redirect(`/buyer/orders/${orderId}`);

  const { error } = await supabase
    .from("orders")
    .update({ status: "PAID" })
    .eq("id", orderId);
  if (error) redirect(`/buyer/orders/${orderId}?error=payment-failed`);

  revalidatePath(`/buyer/orders/${orderId}`);
  revalidatePath("/buyer");
  revalidatePath("/church");
  revalidatePath("/seller");
  redirect(`/buyer/orders/${orderId}`);
}

export async function markAllNotificationsReadAction() {
  const user = await requireRole(["BUYER", "SELLER", "CHURCH_ADMIN", "PLATFORM_ADMIN"]);
  const supabase = createSupabaseServerClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  revalidatePath("/buyer");
  revalidatePath("/seller");
  revalidatePath("/church");
  return { ok: true } as const;
}
