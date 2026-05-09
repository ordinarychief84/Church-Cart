import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
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
      {!branch && (
        <Card className="mb-4 border-brand-200 bg-brand-50">
          <CardBody className="text-sm text-brand-900">
            <p className="font-semibold">Welcome — let&apos;s set up your branch.</p>
            <p>
              Fill in the details below. Once a churchCart admin approves your branch, buyers across Nigeria
              can choose it as a pickup location.
            </p>
          </CardBody>
        </Card>
      )}
      {branch?.status === "PENDING" && <StatusBanner tone="pending" />}
      {branch?.status === "APPROVED" && <StatusBanner tone="approved" />}
      {branch?.status === "REJECTED" && (
        <StatusBanner tone="rejected" reason={branch.rejectionReason} />
      )}
      <ChurchBranchForm initial={branch} />
    </div>
  );
}

function StatusBanner({
  tone,
  reason,
}: {
  tone: "pending" | "approved" | "rejected";
  reason?: string | null;
}) {
  if (tone === "pending") {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardBody className="flex items-start gap-3 text-amber-900">
          <Clock className="mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Awaiting approval</p>
            <p>
              We&apos;re reviewing your branch details. Once approved you&apos;ll see incoming packages on
              your dashboard.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }
  if (tone === "approved") {
    return (
      <Card className="mb-4 border-emerald-200 bg-emerald-50">
        <CardBody className="flex items-start gap-3 text-emerald-900">
          <ShieldCheck className="mt-0.5" />
          <p className="text-sm">Your branch is approved and visible to buyers at checkout.</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card className="mb-4 border-red-200 bg-red-50">
      <CardBody className="flex items-start gap-3 text-red-900">
        <ShieldX className="mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Application not approved</p>
          {reason && <p>Reason: {reason}</p>}
          <p>Update your details below and re-submit.</p>
        </div>
      </CardBody>
    </Card>
  );
}
