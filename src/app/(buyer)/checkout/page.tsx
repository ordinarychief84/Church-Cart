import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Money } from "@/components/shared/Money";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const user = await requireRole("BUYER");
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: { include: { vendor: true } } } } },
  });

  if (!cart || cart.items.length === 0) redirect("/cart");

  const branches = await prisma.churchBranch.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ state: "asc" }, { branchName: "asc" }],
  });

  const denominations = Array.from(
    new Set(branches.map((b) => b.churchName))
  ).sort();
  const states = Array.from(new Set(branches.map((b) => b.state))).sort();

  const subtotalKobo = cart.items.reduce((s, i) => s + i.priceKobo * i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Checkout" description="Choose how you want your order delivered." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm
            branches={branches.map((b) => ({
              id: b.id,
              churchName: b.churchName,
              denomination: b.denomination,
              branchName: b.branchName,
              address: b.address,
              city: b.city,
              state: b.state,
            }))}
            denominations={denominations}
            states={states}
          />
        </div>
        <Card>
          <CardBody>
            <h2 className="font-semibold">Order summary</h2>
            <ul className="mt-3 divide-y divide-slate-200 text-sm">
              {cart.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span className="truncate pr-2">
                    {i.product.title} × {i.quantity}
                  </span>
                  <Money kobo={i.priceKobo * i.quantity} />
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <Money kobo={subtotalKobo} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Delivery fee will be added based on your choice. Each vendor is a separate order.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
