import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
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
      <VendorProfileForm initial={vendor} />
    </div>
  );
}
