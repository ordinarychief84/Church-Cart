"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/auth";
import { productSchema, sellerProfileSchema, uniqueSlug } from "@/lib/validation";
import type { Seller, Product } from "@/lib/supabase/types";

export type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

export async function upsertSellerProfileAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const user = await requireRole("SELLER");
  const parsed = sellerProfileSchema.safeParse({
    business_name: formData.get("business_name"),
    cac_number: formData.get("cac_number") ?? "",
    church_affiliation: formData.get("church_affiliation") ?? "",
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
    description: formData.get("description") ?? "",
    logo_url: formData.get("logo_url") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  const supabase = createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("sellers")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .maybeSingle<Pick<Seller, "id" | "business_name" | "status">>();

  if (existing) {
    // If a VERIFIED seller changes identity fields, fall back to PENDING so a
    // platform admin can re-review. RLS forbids us setting status directly, so
    // we have to call an SECURITY DEFINER RPC — for MVP we just keep status
    // unchanged on edit and surface a banner on the UI. Re-verification flow
    // can be added with an RPC later.
    const { error } = await supabase
      .from("sellers")
      .update({
        business_name: data.business_name,
        cac_number: data.cac_number || null,
        church_affiliation: data.church_affiliation || null,
        phone: data.phone,
        city: data.city,
        state: data.state,
        description: data.description || null,
        logo_url: data.logo_url || null,
      })
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/seller");
    revalidatePath("/seller/settings");
    return { ok: true };
  }

  const { error } = await supabase.from("sellers").insert({
    user_id: user.id,
    business_name: data.business_name,
    slug: uniqueSlug(data.business_name),
    cac_number: data.cac_number || null,
    church_affiliation: data.church_affiliation || null,
    phone: data.phone,
    city: data.city,
    state: data.state,
    description: data.description || null,
    logo_url: data.logo_url || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/seller");
  redirect("/seller");
}

async function loadOwnSeller(userId: string) {
  const supabase = createSupabaseServerClient();
  return supabase
    .from("sellers")
    .select("id, status, slug")
    .eq("user_id", userId)
    .single<Pick<Seller, "id" | "status" | "slug">>();
}

export async function createProductAction(_prev: Result, formData: FormData): Promise<Result> {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();

  const { data: seller, error: sellerErr } = await loadOwnSeller(user.id);
  if (sellerErr || !seller) {
    return { error: "Set up your seller profile first." };
  }
  if (seller.status !== "VERIFIED") {
    return {
      error: "Your seller profile is still awaiting verification — you can list products once approved.",
    };
  }

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      seller_id: seller.id,
      category_id: d.category_id,
      slug: uniqueSlug(d.title),
      title: d.title,
      description: d.description,
      price_kobo: d.price_kobo,
      inventory_qty: d.is_digital ? 0 : d.inventory_qty,
      is_digital: d.is_digital,
      weight_grams: d.is_digital ? null : d.weight_grams ?? null,
      available: d.available,
      product_type: d.product_type,
      paystack_payment_url: d.paystack_payment_url || null,
      cover_image_url: d.cover_image_url || null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !created) {
    if (error?.code === "23514") {
      return { error: "That Paystack URL doesn't look right — use https://paystack.com/pay/your-link." };
    }
    return { error: error?.message ?? "Could not create the product" };
  }

  // Physical products: attach selected pickup branches.
  if (!d.is_digital && d.pickup_branch_ids.length > 0) {
    const rows = d.pickup_branch_ids.map((bid) => ({
      product_id: created.id,
      branch_id: bid,
    }));
    const { error: linkErr } = await supabase.from("product_pickup_locations").insert(rows);
    if (linkErr) return { error: linkErr.message };
  }

  revalidatePath("/seller/products");
  revalidatePath("/marketplace");
  redirect("/seller/products");
}

function parseProductFormData(formData: FormData) {
  return productSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    product_type: formData.get("product_type"),
    price_naira: formData.get("price_naira"),
    paystack_payment_url: formData.get("paystack_payment_url") ?? "",
    cover_image_url: formData.get("cover_image_url") ?? "",
    available: formData.get("available") === "on",
    is_digital: formData.get("is_digital") === "on",
    inventory_qty: formData.get("inventory_qty") ?? 0,
    weight_grams: formData.get("weight_grams") || null,
    pickup_branch_ids: formData.get("pickup_branch_ids") ?? "",
  });
}

export async function updateProductAction(
  productId: string,
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();

  const { data: seller } = await loadOwnSeller(user.id);
  if (!seller) return { error: "Seller profile not found" };

  // RLS already gates UPDATE to the seller's own products, but we re-check for
  // a clean error rather than a generic 400.
  const { data: product } = await supabase
    .from("products")
    .select("id, slug")
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .maybeSingle<Pick<Product, "id" | "slug">>();
  if (!product) return { error: "Product not found" };

  const parsed = parseProductFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;

  const { error } = await supabase
    .from("products")
    .update({
      title: d.title,
      description: d.description,
      category_id: d.category_id,
      product_type: d.product_type,
      price_kobo: d.price_kobo,
      paystack_payment_url: d.paystack_payment_url || null,
      cover_image_url: d.cover_image_url || null,
      available: d.available,
      is_digital: d.is_digital,
      inventory_qty: d.is_digital ? 0 : d.inventory_qty,
      weight_grams: d.is_digital ? null : d.weight_grams ?? null,
    })
    .eq("id", productId);
  if (error) {
    if (error.code === "23514") {
      return { error: "That Paystack URL doesn't look right — use https://paystack.com/pay/your-link." };
    }
    return { error: error.message };
  }

  // Replace pickup-location links. For physical products, the seller's new
  // set replaces the old. For digital, we clear any leftover links from a
  // prior physical state.
  await supabase.from("product_pickup_locations").delete().eq("product_id", productId);
  if (!d.is_digital && d.pickup_branch_ids.length > 0) {
    const rows = d.pickup_branch_ids.map((bid) => ({
      product_id: productId,
      branch_id: bid,
    }));
    const { error: linkErr } = await supabase.from("product_pickup_locations").insert(rows);
    if (linkErr) return { error: linkErr.message };
  }

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
  revalidatePath(`/p/${product.slug}`);
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function toggleProductAvailabilityAction(productId: string) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await loadOwnSeller(user.id);
  if (!seller) return { error: "Seller profile not found" } as const;
  const { data: current } = await supabase
    .from("products")
    .select("available, slug")
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .single<{ available: boolean; slug: string }>();
  if (!current) return { error: "Product not found" } as const;
  const { error } = await supabase
    .from("products")
    .update({ available: !current.available })
    .eq("id", productId);
  if (error) return { error: error.message } as const;
  revalidatePath("/seller/products");
  revalidatePath(`/p/${current.slug}`);
  return { ok: true } as const;
}

export async function deleteProductAction(productId: string) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await loadOwnSeller(user.id);
  if (!seller) return { error: "Seller profile not found" } as const;
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("seller_id", seller.id);
  if (error) return { error: error.message } as const;
  revalidatePath("/seller/products");
  return { ok: true } as const;
}

/**
 * Seller order transitions. RLS policy `orders_seller_update_progress` is the
 * source of truth for what's allowed — these actions just hit the table and let
 * the trigger fan out notifications. The seller dashboard hides invalid buttons
 * but a stale page can still post; we surface a friendly error in that case.
 */
async function sellerTransitionOrder(
  orderId: string,
  expected: "PAID" | "PROCESSING",
  next: "PROCESSING" | "SHIPPED"
) {
  const user = await requireRole("SELLER");
  const supabase = createSupabaseServerClient();
  const { data: seller } = await loadOwnSeller(user.id);
  if (!seller) return { error: "Seller profile not found" } as const;
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, seller_id")
    .eq("id", orderId)
    .maybeSingle<{ id: string; status: string; seller_id: string }>();
  if (!order || order.seller_id !== seller.id) {
    return { error: "Order not found" } as const;
  }
  if (order.status !== expected) {
    return { error: `Can't mark ${next.toLowerCase()} from "${order.status.toLowerCase()}"` } as const;
  }
  const { error } = await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", orderId);
  if (error) return { error: error.message } as const;
  revalidatePath("/seller");
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath(`/buyer/orders/${orderId}`);
  revalidatePath("/church");
  return { ok: true } as const;
}

export async function markOrderProcessingAction(orderId: string) {
  return sellerTransitionOrder(orderId, "PAID", "PROCESSING");
}

export async function markOrderShippedAction(orderId: string) {
  return sellerTransitionOrder(orderId, "PROCESSING", "SHIPPED");
}
