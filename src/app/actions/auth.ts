"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/supabase/auth";
import type { UserRole } from "@/lib/supabase/types";

const PUBLIC_ROLES = ["BUYER", "SELLER", "CHURCH_ADMIN"] as const satisfies readonly UserRole[];

const completeOnboardingSchema = z.object({
  role: z.enum(PUBLIC_ROLES),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/\s+/g, "") : ""))
    .refine(
      (v) => v === "" || /^\+?[0-9]{10,14}$/.test(v),
      "Phone must be 10–14 digits (e.g. 08012345678)"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  role: z.enum(PUBLIC_ROLES),
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type FormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { fullName, email, phone, password, role } = parsed.data;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Used by handle_new_user trigger to populate justhazaar.profiles.
      data: { full_name: fullName, phone, role },
    },
  });
  if (error) {
    return { error: error.message };
  }
  // Supabase Auth will set the session cookies via the cookie store. Redirect
  // to the role's home (works whether or not email confirmation is required;
  // if confirmation is on, this will fall through to /verify-email).
  redirect(ROLE_HOME[role]);
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email or password is wrong." };
  }
  // We don't know the role until after sign-in; fetch the profile to route.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded_at")
    .single<{ role: UserRole; onboarded_at: string | null }>();
  if (!profile) redirect("/");
  if (profile.onboarded_at === null) redirect("/onboarding");
  redirect(ROLE_HOME[profile.role]);
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Kick off Google OAuth. Supabase returns a hosted-consent URL we redirect
 * the browser to; Google then redirects back to /auth/callback?code=...
 * which exchanges the code and routes by onboarding state.
 *
 * `next` is an optional internal path to land on after onboarding finishes
 * (e.g. ?next=/p/some-product to return to a product page after signing in).
 */
export async function signInWithGoogleAction(formData: FormData) {
  const next = typeof formData.get("next") === "string" ? (formData.get("next") as string) : "";

  const supabase = createSupabaseServerClient();
  const h = headers();
  // Prefer the public app URL when set; fall back to the forwarded host so
  // the OAuth `redirect_to` is correct in both dev and prod.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (h.get("origin") || `https://${h.get("x-forwarded-host") ?? h.get("host")}`);

  const callbackUrl = new URL("/auth/callback", origin);
  if (next.startsWith("/") && !next.startsWith("//")) {
    callbackUrl.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data?.url) {
    redirect("/login?error=" + encodeURIComponent(error?.message ?? "Could not start Google sign-in"));
  }
  redirect(data.url);
}

/**
 * Finish onboarding for an OAuth user. Calls the SECURITY DEFINER RPC that
 * sets role + stamps onboarded_at; the RPC enforces "only once" and rejects
 * PLATFORM_ADMIN. Returns the role on success so the caller can redirect home.
 */
export type CompleteOnboardingState = { error?: string };

export async function completeOnboardingAction(
  _prev: CompleteOnboardingState,
  formData: FormData
): Promise<CompleteOnboardingState> {
  const parsed = completeOnboardingSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) {
    return { error: "Pick a role to continue." };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("complete_onboarding", { p_role: parsed.data.role });
  if (error) {
    return { error: error.message };
  }
  const nextRaw = formData.get("next");
  const next = typeof nextRaw === "string" ? nextRaw : "";
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect(ROLE_HOME[parsed.data.role]);
}
