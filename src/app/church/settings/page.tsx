import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ChurchBranch } from "@/lib/supabase/types";
import { ChurchBranchForm } from "./ChurchBranchForm";

export const dynamic = "force-dynamic";

export default async function ChurchSettingsPage() {
  const user = await requireRole("CHURCH_ADMIN");
  const supabase = createSupabaseServerClient();
  const { data: branch } = await supabase
    .from("church_branches")
    .select("*")
    .eq("admin_user_id", user.id)
    .maybeSingle<ChurchBranch>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 border-b border-[color:var(--cp-rule)] pb-4">
        <p className="text-label text-[color:var(--cp-cocoa-mid)]">Church admin</p>
        <h1 className="text-h1 mt-1 text-[color:var(--cp-cocoa-deep)]">Branch settings</h1>
        <p className="mt-1 text-body-sm text-[color:var(--cp-cocoa-mid)]">
          Tell us about your branch so members can pick it as a pickup destination.
        </p>
      </header>

      {!branch && (
        <Banner
          tone="sand"
          title="Register your branch"
          body="Fill in your branch details and a platform admin will review. Most branches are approved within 24 hours."
        />
      )}
      {branch?.status === "PENDING" && (
        <Banner
          tone="pending"
          icon={<Clock />}
          title="Awaiting approval"
          body="Members won't see your branch as a pickup destination until a platform admin approves it."
        />
      )}
      {branch?.status === "APPROVED" && (
        <Banner
          tone="success"
          icon={<ShieldCheck />}
          title="Kingdom Approved"
          body="Your branch is live. Members can choose it as their pickup location."
        />
      )}
      {branch?.status === "REJECTED" && (
        <Banner
          tone="failed"
          icon={<ShieldX />}
          title="Not approved"
          body={branch.rejection_reason ?? "Update your details below and re-submit."}
        />
      )}

      <div className="mt-6">
        <ChurchBranchForm initial={branch} contactDefault={user.profile.full_name} />
      </div>
    </main>
  );
}

function Banner({
  tone,
  icon,
  title,
  body,
}: {
  tone: "sand" | "pending" | "success" | "failed";
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles: Record<typeof tone, React.CSSProperties> = {
    sand: { background: "var(--cp-sand)", borderColor: "var(--cp-sand-dark)", color: "var(--cp-cocoa-deep)" },
    pending: {
      background: "rgba(219,164,74,0.2)",
      borderColor: "rgba(219,164,74,0.5)",
      color: "var(--cp-cocoa-deep)",
    },
    success: { background: "#E0F0E7", borderColor: "rgba(45,122,79,0.4)", color: "#1A5C32" },
    failed: { background: "#FEEFE9", borderColor: "#F4B7A8", color: "#842029" },
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 text-body-sm" style={styles[tone]}>
      {icon && <div className="mt-0.5">{icon}</div>}
      <div>
        <p className="font-editorial font-bold">{title}</p>
        <p>{body}</p>
      </div>
    </div>
  );
}
