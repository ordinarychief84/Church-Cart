"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/auth";
import { churchBranchSchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/validation";
import type { ChurchBranch } from "@/lib/supabase/types";

export type Result = { ok?: true; error?: string; fieldErrors?: Record<string, string[]> };

export async function upsertChurchBranchAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const user = await requireRole("CHURCH_ADMIN");
  const parsed = churchBranchSchema.safeParse({
    branch_name: formData.get("branch_name"),
    denomination: formData.get("denomination"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    contact_person: formData.get("contact_person"),
    contact_phone: formData.get("contact_phone"),
    operating_days: formData.get("operating_days"),
    operating_hours: formData.get("operating_hours"),
    pickup_capacity: formData.get("pickup_capacity"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;
  const supabase = createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("church_branches")
    .select("id, branch_name, status")
    .eq("admin_user_id", user.id)
    .maybeSingle<Pick<ChurchBranch, "id" | "branch_name" | "status">>();

  if (existing) {
    // RLS forbids the admin from changing `status` directly — a separate
    // platform-admin review handles that. We just save the editable fields.
    const { error } = await supabase
      .from("church_branches")
      .update({
        branch_name: data.branch_name,
        denomination: data.denomination,
        address: data.address,
        city: data.city,
        state: data.state,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        operating_days: data.operating_days,
        operating_hours: data.operating_hours,
        pickup_capacity: data.pickup_capacity,
      })
      .eq("admin_user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/church");
    revalidatePath("/church/settings");
    return { ok: true };
  }

  const { error } = await supabase.from("church_branches").insert({
    admin_user_id: user.id,
    branch_name: data.branch_name,
    denomination: data.denomination,
    slug: uniqueSlug(`${data.denomination}-${data.branch_name}`),
    address: data.address,
    city: data.city,
    state: data.state,
    contact_person: data.contact_person,
    contact_phone: data.contact_phone,
    operating_days: data.operating_days,
    operating_hours: data.operating_hours,
    pickup_capacity: data.pickup_capacity,
  });
  if (error) return { error: error.message };
  revalidatePath("/church");
  redirect("/church");
}

/**
 * Church admin order transitions. RLS policy `orders_church_update_progress`
 * gates allowed transitions; the BEFORE-UPDATE trigger fans out notifications
 * and stamps `picked_up_at`. We re-check on the server for friendlier errors
 * than the generic RLS "violates row-level security policy" message.
 */
async function churchTransitionOrder(
  orderId: string,
  expected: "SHIPPED" | "ARRIVED_AT_CHURCH" | "READY_FOR_PICKUP",
  next: "ARRIVED_AT_CHURCH" | "READY_FOR_PICKUP" | "PICKED_UP"
) {
  const user = await requireRole("CHURCH_ADMIN");
  const supabase = createSupabaseServerClient();

  const { data: branch } = await supabase
    .from("church_branches")
    .select("id, status")
    .eq("admin_user_id", user.id)
    .maybeSingle<{ id: string; status: string }>();
  if (!branch) return { error: "Register your branch first" } as const;
  if (branch.status !== "APPROVED") {
    return { error: "Your branch isn't approved yet" } as const;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, church_branch_id")
    .eq("id", orderId)
    .maybeSingle<{ id: string; status: string; church_branch_id: string | null }>();
  if (!order || order.church_branch_id !== branch.id) {
    return { error: "Order not found" } as const;
  }
  if (order.status !== expected) {
    const friendly = next.replace(/_/g, " ").toLowerCase();
    return { error: `Can't mark ${friendly} from "${order.status.toLowerCase()}"` } as const;
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: next })
    .eq("id", orderId);
  if (error) return { error: error.message } as const;

  revalidatePath("/church");
  revalidatePath("/church/manifest");
  revalidatePath(`/buyer/orders/${orderId}`);
  revalidatePath("/seller");
  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  return { ok: true } as const;
}

export async function markOrderArrivedAction(orderId: string) {
  return churchTransitionOrder(orderId, "SHIPPED", "ARRIVED_AT_CHURCH");
}

export async function markOrderReadyAction(orderId: string) {
  return churchTransitionOrder(orderId, "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP");
}

export async function markOrderPickedUpAction(orderId: string) {
  return churchTransitionOrder(orderId, "READY_FOR_PICKUP", "PICKED_UP");
}
