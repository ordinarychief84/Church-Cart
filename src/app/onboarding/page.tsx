import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireUser, ROLE_HOME } from "@/lib/supabase/auth";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await requireUser();

  // Already onboarded → no replays.
  if (user.profile.onboarded_at) {
    redirect(ROLE_HOME[user.profile.role]);
  }

  return (
    <AuthShell
      eyebrow="One more step"
      title={`Welcome, ${user.profile.full_name.split(" ")[0]}`}
      intro="Pick the role that fits you today. Sellers and church admins are reviewed before going live."
    >
      <OnboardingForm next={searchParams.next} />
    </AuthShell>
  );
}
