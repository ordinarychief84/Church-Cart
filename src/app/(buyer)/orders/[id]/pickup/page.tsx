import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ChurchIcon } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export default async function PickupCodePage({ params }: { params: { id: string } }) {
  const user = await requireRole("BUYER");
  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id },
    include: { churchBranch: true },
  });
  if (!order || order.deliveryType !== "CHURCH_PICKUP" || !order.churchBranch || !order.pickupCode) {
    notFound();
  }

  const qrDataUrl = await QRCode.toDataURL(order.pickupToken!, {
    margin: 1,
    width: 320,
    color: { dark: "#1e3a8a", light: "#ffffff" },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardBody className="flex flex-col items-center text-center">
          <ChurchIcon className="text-brand-700" />
          <p className="mt-2 text-sm text-slate-500">Pickup code for order</p>
          <p className="text-xs text-slate-400">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="my-4 font-mono text-4xl font-semibold tracking-[0.4em] text-slate-900">
            {order.pickupCode}
          </p>
          <Image
            src={qrDataUrl}
            alt="Pickup QR code"
            width={240}
            height={240}
            unoptimized
            className="h-auto w-full max-w-[240px] rounded"
          />
          <p className="mt-4 text-sm text-slate-600">
            Show this code or the QR to a {order.churchBranch.churchName} staff member at:
          </p>
          <p className="mt-1 text-sm font-medium">
            {order.churchBranch.branchName}
          </p>
          <p className="text-xs text-slate-500">
            {order.churchBranch.address}, {order.churchBranch.city}, {order.churchBranch.state}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Open: {order.churchBranch.operatingDays} · {order.churchBranch.operatingHours}
          </p>
          <div className="mt-4">
            <OrderStatusBadge status={order.status} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
