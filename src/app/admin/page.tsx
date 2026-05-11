import { ShieldCheck, Store, ChurchIcon, ListOrdered } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireRole("PLATFORM_ADMIN");
  const supabase = createSupabaseServerClient();
  const [{ count: pendingSellers }, { count: pendingChurches }, { count: totalProducts }] =
    await Promise.all([
      supabase.from("sellers").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase
        .from("church_branches")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase.from("products").select("*", { count: "exact", head: true }),
    ]);

  return (
    <DashboardShell
      badge="Platform admin"
      icon={ShieldCheck}
      title="Marketplace overview"
      subtitle="Approve sellers, approve church branches, manage the platform."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Store size={18} />} label="Pending sellers" value={pendingSellers ?? 0} />
        <Stat icon={<ChurchIcon size={18} />} label="Pending churches" value={pendingChurches ?? 0} />
        <Stat icon={<ListOrdered size={18} />} label="Products live" value={totalProducts ?? 0} />
      </div>
      <p className="mt-6 text-body-sm text-[color:var(--cp-cocoa-mid)]">
        Admin tools (approval queues, dispute resolution, denomination management) will be wired in
        the next iteration. For now the role + RLS policies are in place so admins can safely
        access everything.
      </p>
    </DashboardShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--cp-sand)] text-[color:var(--cp-cocoa-deep)]">
        {icon}
      </div>
      <p className="text-label text-[color:var(--cp-cocoa-mid)]">{label}</p>
      <p className="mt-1 font-editorial text-2xl font-bold text-[color:var(--cp-cocoa-deep)]">
        {value}
      </p>
    </Card>
  );
}
