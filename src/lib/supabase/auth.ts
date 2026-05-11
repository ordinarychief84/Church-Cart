import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";
import type { Profile, UserRole } from "./types";

export type AuthedUser = {
  id: string;
  email: string | null;
  profile: Profile;
};

/**
 * Returns the calling user + their justhazaar profile, or null if unauthed.
 * The profile is provisioned by the handle_new_user trigger on signup.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;
  return { id: user.id, email: user.email ?? null, profile };
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: UserRole | UserRole[]): Promise<AuthedUser> {
  const user = await requireUser();
  // OAuth users land here without a chosen role. Send them through onboarding
  // first; the onboarding page itself uses requireUser (not requireRole) so
  // there's no redirect loop.
  if (user.profile.onboarded_at === null) {
    redirect("/onboarding");
  }
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.profile.role)) {
    redirect(ROLE_HOME[user.profile.role]);
  }
  return user;
}

export const ROLE_HOME: Record<UserRole, string> = {
  BUYER: "/buyer",
  SELLER: "/seller",
  CHURCH_ADMIN: "/church",
  PLATFORM_ADMIN: "/admin",
};
