import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { ChurchBranchForm } from "./ChurchBranchForm";

export default async function ChurchSettingsPage() {
  const user = await requireRole("CHURCH_ADMIN");
  const branch = await prisma.churchBranch.findUnique({ where: { adminUserId: user.id } });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Branch settings"
        description="Tell buyers about your church branch. We review every branch before approval."
      />
      <ChurchBranchForm initial={branch} />
    </div>
  );
}
