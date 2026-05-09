import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Money } from "@/components/shared/Money";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReviewForm } from "@/components/orders/ReviewForm";
import { formatDate } from "@/lib/format";
import { CancelOrderButton } from "./CancelOrderButton";
import { OpenDisputeButton } from "./OpenDisputeButton";

export default async function BuyerOrderDetail({ params }: { params: { id: string } }) {
  const user = await requireRole("BUYER");
  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id },
    include: {
      vendor: { select: { id: true, businessName: true, slug: true } },
      items: true,
      churchBranch: {
        select: {
          id: true,
          churchName: true,
          branchName: true,
          address: true,
          city: true,
          state: true,
          contactPerson: true,
          contactPhone: true,
          operatingDays: true,
          operatingHours: true,
        },
      },
      payment: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      dispute: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title={`Order #${order.id.slice(-6).toUpperCase()}`}
        description={`Placed ${formatDate(order.createdAt)} · ${order.vendor.businessName}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-4">
        {order.deliveryType === "CHURCH_PICKUP" && order.churchBranch && (
          <Card>
            <CardBody>
              <p className="font-semibold">Church pickup</p>
              <p className="mt-1 text-sm text-slate-600">
                {order.churchBranch.churchName} — {order.churchBranch.branchName}
              </p>
              <p className="text-xs text-slate-500">
                {order.churchBranch.address}, {order.churchBranch.city}, {order.churchBranch.state}
              </p>
              {order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED" && (
                <Link
                  href={`/orders/${order.id}/pickup`}
                  className="mt-3 inline-flex h-9 items-center rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800"
                >
                  View pickup code
                </Link>
              )}
            </CardBody>
          </Card>
        )}
        {order.deliveryType === "HOME_DELIVERY" && (
          <Card>
            <CardBody>
              <p className="font-semibold">Home delivery</p>
              <p className="mt-1 text-sm text-slate-600">{order.deliveryAddress}</p>
              <p className="text-xs text-slate-500">
                {order.deliveryCity}, {order.deliveryState}
              </p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <p className="font-semibold">Items</p>
            <ul className="mt-2 divide-y divide-slate-200 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between py-2">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <Money kobo={item.priceKobo * item.quantity} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
              <Row label="Subtotal" kobo={order.subtotalKobo} />
              <Row label="Delivery" kobo={order.logisticsFeeKobo} />
              <Row label="Total" kobo={order.totalKobo} bold />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="font-semibold">Timeline</p>
            <OrderTimeline events={order.statusHistory} />
          </CardBody>
        </Card>

        {(order.status === "PICKED_UP" ||
          order.status === "DELIVERED" ||
          order.status === "COMPLETED") && (
          <Card>
            <CardBody>
              <p className="font-semibold">Leave a review</p>
              <p className="text-xs text-slate-500">Help other buyers know what to expect.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {order.items.map((item) => (
                  <ReviewForm key={item.id} productId={item.productId} productTitle={item.title} />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {(order.status === "PENDING_PAYMENT" || order.status === "PAID") && (
            <CancelOrderButton orderId={order.id} />
          )}
          {(order.status === "PICKED_UP" || order.status === "DELIVERED") && !order.dispute && (
            <OpenDisputeButton orderId={order.id} />
          )}
          {order.status === "PENDING_PAYMENT" && order.payment && (
            <Link
              href={`/checkout/mock-payment?ref=${order.payment.reference}`}
              className="inline-flex h-10 items-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
            >
              Continue to payment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, kobo, bold }: { label: string; kobo: number; bold?: boolean }) {
  return (
    <div className={"flex justify-between " + (bold ? "font-semibold text-slate-900" : "")}>
      <span>{label}</span>
      <Money kobo={kobo} />
    </div>
  );
}
