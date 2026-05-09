import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { Money } from "@/components/shared/Money";
import { CartLine } from "./CartLine";

export default async function CartPage() {
  const user = await requireRole("BUYER");
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: { include: { images: { take: 1 }, vendor: true } },
        },
      },
    },
  });

  const items = cart?.items ?? [];
  const subtotalKobo = items.reduce((s, i) => s + i.priceKobo * i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Your cart" description={`${items.length} item${items.length === 1 ? "" : "s"}`} />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Your cart is empty"
          description="Browse the marketplace to find products from verified Christian vendors."
          action={
            <Link href="/marketplace" className="text-brand-700 hover:underline">
              Go to marketplace →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <ul className="lg:col-span-2 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {items.map((item) => (
              <CartLine key={item.id} item={item} />
            ))}
          </ul>
          <Card>
            <CardBody>
              <h2 className="font-semibold">Order summary</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <Money kobo={subtotalKobo} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Shipping calculated at checkout.</p>
              <Link
                href="/checkout"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800"
              >
                Proceed to checkout
              </Link>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
