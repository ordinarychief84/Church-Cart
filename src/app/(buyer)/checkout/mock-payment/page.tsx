import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Money } from "@/components/shared/Money";
import { simulatePaymentAction } from "@/app/actions/orders";

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: { ref?: string; orders?: string };
}) {
  await requireRole("BUYER");
  const ref = searchParams.ref;
  if (!ref) redirect("/cart");

  const payment = await prisma.payment.findUnique({
    where: { reference: ref },
    include: { orders: { include: { items: true, vendor: true } } },
  });
  if (!payment) redirect("/cart");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className="border-amber-200 bg-amber-50">
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Sandbox payment
          </p>
          <p className="mt-1 text-sm text-amber-900">
            Real Paystack is not connected in MVP. Use the buttons below to simulate the result.
          </p>
        </CardBody>
      </Card>
      <Card className="mt-4">
        <CardBody>
          <p className="text-sm text-slate-500">Reference</p>
          <p className="font-mono text-sm">{payment.reference}</p>
          <p className="mt-3 text-sm text-slate-500">Total</p>
          <Money kobo={payment.amountKobo} className="text-2xl font-semibold" />

          <div className="mt-6 grid gap-2">
            <form action={simulatePaymentAction.bind(null, payment.reference, "success")}>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> Simulate successful payment
              </button>
            </form>
            <form action={simulatePaymentAction.bind(null, payment.reference, "failure")}>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50"
              >
                <XCircle size={16} /> Simulate failed payment
              </button>
            </form>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            <Link href="/orders" className="hover:underline">
              ← back to orders
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
