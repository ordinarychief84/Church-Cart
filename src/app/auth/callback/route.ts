import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Supabase redirects users back here after a provider (Google,
 * etc.) approves them. We exchange the short-lived `?code=` for a session
 * cookie, then route based on onboarding state:
 *   - profile.onboarded_at IS NULL → /onboarding to pick a role
 *   - otherwise                    → ?next param if safe, else role's home
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "";
  const errorDesc = url.searchParams.get("error_description");

  if (errorDesc) {
    const u = new URL("/login", url.origin);
    u.searchParams.set("error", errorDesc);
    return NextResponse.redirect(u);
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const u = new URL("/login", url.origin);
    u.searchParams.set("error", "Could not sign you in. Please try again.");
    return NextResponse.redirect(u);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded_at")
    .eq("id", user.id)
    .maybeSingle<{ role: string; onboarded_at: string | null }>();

  if (!profile || profile.onboarded_at === null) {
    const u = new URL("/onboarding", url.origin);
    if (next) u.searchParams.set("next", next);
    return NextResponse.redirect(u);
  }

  // Only allow internal "next" paths to avoid open redirects.
  if (next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, url.origin));
  }
  const home =
    profile.role === "SELLER"
      ? "/seller"
      : profile.role === "CHURCH_ADMIN"
        ? "/church"
        : profile.role === "PLATFORM_ADMIN"
          ? "/admin"
          : "/buyer";
  return NextResponse.redirect(new URL(home, url.origin));
}
