import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { VendorProfileForm } from "./VendorProfileForm";

export default async function VendorSettingsPage() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Store settings"
        description="Tell buyers about your business. We review every store before approval."
      />
      {!vendor && (
        <Card className="mb-4 border-brand-200 bg-brand-50">
          <CardBody className="text-sm text-brand-900">
            <p className="font-semibold">Welcome to churchCart!</p>
            <p>
              Fill this form to submit your store for verification. Approval typically takes under 24 hours.
              You&apos;ll see your dashboard right after.
            </p>
          </CardBody>
        </Card>
      )}
      {vendor?.status === "PENDING" && <StatusBanner tone="pending" />}
      {vendor?.status === "VERIFIED" && <StatusBanner tone="verified" />}
      {vendor?.status === "REJECTED" && (
        <StatusBanner tone="rejected" reason={vendor.rejectionReason} />
      )}
      <VendorProfileForm initial={vendor} />
    </div>
  );
}

function StatusBanner({
  tone,
  reason,
}: {
  tone: "pending" | "verified" | "rejected";
  reason?: string | null;
}) {
  if (tone === "pending") {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardBody className="flex items-start gap-3 text-amber-900">
          <Clock className="mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Awaiting verification</p>
            <p>
              We&apos;re reviewing your store details. You can edit them below until you&apos;re verified.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }
  if (tone === "verified") {
    return (
      <Card className="mb-4 border-emerald-200 bg-emerald-50">
        <CardBody className="flex items-start gap-3 text-emerald-900">
          <ShieldCheck className="mt-0.5" />
          <p className="text-sm">Your store is verified. Edits below are saved instantly.</p>
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
