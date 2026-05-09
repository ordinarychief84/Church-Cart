import { NextResponse } from "next/server";
import { Prisma, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPaystackSignature } from "@/lib/payments";
import { applyOrderTransition } from "@/lib/orders/applyTransition";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: { event?: string; data?: { reference?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const ref = event.data.reference;

    // Conditional update: only the first concurrent webhook delivery for a
    // given reference will succeed. The `updateMany` is atomic at the DB
    // level — we use the row count to decide whether to fan out transitions.
    const claimed = await prisma.payment.updateMany({
      where: { reference: ref, status: PaymentStatus.INITIATED },
      data: {
        status: PaymentStatus.SUCCEEDED,
        verifiedAt: new Date(),
        rawResponse: event as Prisma.InputJsonValue,
      },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    const payment = await prisma.payment.findUnique({
      where: { reference: ref },
      include: { orders: { select: { id: true } } },
    });
    if (!payment) return NextResponse.json({ ok: true });

    for (const o of payment.orders) {
      try {
        await applyOrderTransition(o.id, { type: "PAYMENT_VERIFIED", actor: { kind: "system" } });
      } catch (err) {
        // Already past PENDING_PAYMENT — webhook re-delivery race. Log so an
        // operator can investigate genuine bugs.
        console.warn("[paystack-webhook] order transition skipped", o.id, err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
