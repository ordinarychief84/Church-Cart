import Link from "next/link";
import { Package, ScanLine, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { logoutAction } from "@/app/actions/auth";

export default async function ChurchDashboard() {
  const user = await requireRole("CHURCH_ADMIN");
  const church = await prisma.churchBranch.findUnique({ where: { adminUserId: user.id } });

  if (!church) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Welcome, church admin" description="Tell us about your branch to begin." />
        <Card>
          <CardBody>
            <Link
              href="/church/settings"
              className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Set up branch
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const incoming = await prisma.order.count({
    where: {
      churchBranchId: church.id,
      status: { in: ["SHIPPED", "ARRIVED_AT_CHURCH", "READY_FOR_PICKUP"] },
    },
  });
  const today = await prisma.order.count({
    where: {
      churchBranchId: church.id,
      status: "PICKED_UP",
      pickedUpAt: { gte: new Date(new Date().toISOString().slice(0, 10)) },
    },
  });
  const failed = await prisma.order.count({
    where: { churchBranchId: church.id, status: "FAILED_PICKUP" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={`${church.churchName} — ${church.branchName}`}
        description={`${church.address}, ${church.city}, ${church.state}`}
        action={
          <>
            {church.status === "PENDING" && <Badge tone="warning">Pending approval</Badge>}
            {church.status === "APPROVED" && <Badge tone="success">Approved</Badge>}
            {church.status === "REJECTED" && <Badge tone="danger">Rejected</Badge>}
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          </>
        }
      />

      {church.status !== "APPROVED" && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="mt-0.5" />
            <p className="text-sm">
              Your branch is {church.status.toLowerCase()}. Buyers will only be able to choose your branch
              after platform approval.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Incoming packages" value={incoming} icon={<Package />} href="/church/packages" />
        <Stat label="Picked up today" value={today} icon={<ScanLine />} href="/church/history" />
        <Stat label="Failed pickups" value={failed} icon={<ShieldAlert />} href="/church/history" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-brand-400">
        <CardBody className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">{icon}</div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
