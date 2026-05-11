import { LogOut, type LucideIcon } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/supabase/auth";
import { NotificationsBell } from "./NotificationsBell";
import { LogoLockup } from "./brand/Logo";

export async function DashboardShell({
  title,
  subtitle,
  badge,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-[color:var(--cp-cream)]">
      <header className="border-b border-[color:var(--cp-rule)] bg-[color:var(--cp-cocoa-deep)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <LogoLockup variant="dark" size="sm" />
          <div className="flex items-center gap-3 font-ui text-sm text-white/80">
            {user && <NotificationsBell userId={user.id} />}
            <form action={signOutAction}>
              <button className="inline-flex items-center gap-1 transition-colors hover:text-[color:var(--cp-gold)]">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start gap-4 border-b border-[color:var(--cp-rule)] pb-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]">
            <Icon size={22} />
          </div>
          <div className="flex-1">
            <p className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--cp-cocoa-mid)]">
              {badge}
            </p>
            <h1 className="mt-1 font-editorial text-2xl font-bold tracking-tight text-[color:var(--cp-cocoa-deep)]">
              {title}
            </h1>
            <p className="mt-1 font-editorial text-sm text-[color:var(--cp-mid)]">{subtitle}</p>
            {user && (
              <p className="mt-2 font-mono text-[11px] text-[color:var(--cp-mid)]">
                Signed in as <span className="text-[color:var(--cp-cocoa-mid)]">{user.email}</span>
              </p>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
