import { requireApprovedChurchAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPickupPage() {
  await requireApprovedChurchAdmin();
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader
        title="Verify pickup"
        description="Enter the 6-digit code shown on the buyer's phone."
      />
      <Card>
        <CardBody>
          <VerifyForm />
        </CardBody>
      </Card>
    </div>
  );
}
