import Link from "next/link";
import { LogIn, User as UserIcon } from "lucide-react";
import { getCurrentUser, ROLE_HOME } from "@/lib/supabase/auth";
import { NotificationsBell } from "./NotificationsBell";
import { LogoLockup } from "./brand/Logo";

export async function TopNav() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--cp-rule)] bg-[color:var(--cp-cocoa-deep)] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <LogoLockup variant="dark" size="sm" />
          <nav className="hidden items-center gap-5 font-ui text-sm text-white/70 sm:flex">
            <Link href="/marketplace" className="transition-colors hover:text-[color:var(--cp-gold)]">
              Marketplace
            </Link>
          </nav>
        </div>
        <nav className="flex items-center gap-3 font-ui text-sm">
          {user ? (
            <>
              <NotificationsBell userId={user.id} />
              <Link
                href={ROLE_HOME[user.profile.role]}
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--cp-gold)] px-3 py-1.5 font-medium text-[color:var(--cp-cocoa-deep)] hover:bg-[color:var(--cp-gold-light)]"
              >
                <UserIcon size={16} />
                <span className="hidden sm:inline">{user.profile.full_name.split(" ")[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-2 py-1.5 text-white/80 hover:text-[color:var(--cp-gold)] sm:inline-flex"
              >
                Welcome back
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--cp-gold)] px-3 py-1.5 font-medium text-[color:var(--cp-cocoa-deep)] hover:bg-[color:var(--cp-gold-light)]"
              >
                <LogIn size={16} /> Join the community
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
