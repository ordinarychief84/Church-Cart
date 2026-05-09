import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
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
    const payment = await prisma.payment.findUnique({
      where: { reference: ref },
      include: { orders: true },
    });
    if (!payment) return NextResponse.json({ ok: true });

    // Idempotent: skip if already succeeded
    if (payment.status === PaymentStatus.SUCCEEDED) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED, verifiedAt: new Date(), rawResponse: event as never },
    });
    for (const o of payment.orders) {
      try {
        await applyOrderTransition(o.id, { type: "PAYMENT_VERIFIED", actor: { kind: "system" } });
      } catch {
        // already past PENDING_PAYMENT — ignore
      }
    }
  }

  return NextResponse.json({ ok: true });
}
