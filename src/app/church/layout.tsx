import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/supabase/auth";
import { NotificationsBell } from "@/components/NotificationsBell";
import { LogoLockup } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function ChurchLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CHURCH_ADMIN");
  return (
    <div className="min-h-screen bg-[color:var(--cp-cream)]">
      <header className="border-b border-[color:var(--cp-rule)] bg-[color:var(--cp-cocoa-deep)] print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <LogoLockup variant="dark" size="sm" />
          <div className="flex items-center gap-4 font-ui text-sm text-white/80">
            <NotificationsBell userId={user.id} />
            <Link href="/church" className="transition-colors hover:text-[color:var(--cp-gold)]">
              Dashboard
            </Link>
            <Link
              href="/church/manifest"
              className="transition-colors hover:text-[color:var(--cp-gold)]"
            >
              Pickup manifest
            </Link>
            <Link
              href="/church/settings"
              className="transition-colors hover:text-[color:var(--cp-gold)]"
            >
              Settings
            </Link>
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-1 transition-colors hover:text-[color:var(--cp-gold)]">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
