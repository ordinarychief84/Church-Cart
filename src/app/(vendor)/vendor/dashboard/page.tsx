import Link from "next/link";
import { Boxes, ListOrdered, ShieldAlert, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { logoutAction } from "@/app/actions/auth";

export default async function VendorDashboard() {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });

  if (!vendor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Welcome, vendor" description="Set up your store profile to begin." />
        <Card>
          <CardBody>
            <p className="mb-4 text-sm text-slate-600">
              Before you can list products you need to fill out your store details. Approval typically takes
              under 24 hours.
            </p>
            <Link
              href="/vendor/settings"
              className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Set up store
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const [productsCount, ordersCount, totalKoboAgg, payoutsAgg] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.order.count({ where: { vendorId: vendor.id, status: { notIn: ["CANCELLED"] } } }),
    prisma.order.aggregate({
      where: { vendorId: vendor.id, status: { in: ["PICKED_UP", "DELIVERED", "COMPLETED"] } },
      _sum: { vendorAmountKobo: true },
    }),
    prisma.payout.aggregate({
      where: { vendorId: vendor.id, status: "PENDING" },
      _sum: { amountKobo: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={vendor.businessName}
        description="Your store at a glance."
        action={
          <>
            {vendor.status === "PENDING" && <Badge tone="warning">Pending verification</Badge>}
            {vendor.status === "VERIFIED" && <Badge tone="success">Verified</Badge>}
            {vendor.status === "REJECTED" && <Badge tone="danger">Rejected</Badge>}
            <form action={logoutAction}>
              <button className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
            </form>
          </>
        }
      />

      {vendor.status !== "VERIFIED" && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-start gap-3 text-amber-900">
            <ShieldAlert className="mt-0.5" />
            <div>
              <p className="font-medium">
                {vendor.status === "PENDING"
                  ? "Your store is awaiting platform approval."
                  : "Your application was not approved."}
              </p>
              <p className="text-sm">
                {vendor.status === "PENDING"
                  ? "You will be able to list products once approved."
                  : vendor.rejectionReason || "Please update your store details and contact support."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Products" value={productsCount} icon={<Boxes />} href="/vendor/products" />
        <Stat label="Orders" value={ordersCount} icon={<ListOrdered />} href="/vendor/orders" />
        <Stat
          label="Lifetime sales"
          value={<Money kobo={totalKoboAgg._sum.vendorAmountKobo ?? 0} />}
          icon={<Wallet />}
        />
        <Stat
          label="Pending payouts"
          value={<Money kobo={payoutsAgg._sum.amountKobo ?? 0} />}
          icon={<Wallet />}
        />
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
  value: React.ReactNode;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <CardBody className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </CardBody>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="hover:border-brand-400">{inner}</Card>
      </Link>
    );
  }
  return <Card>{inner}</Card>;
}
