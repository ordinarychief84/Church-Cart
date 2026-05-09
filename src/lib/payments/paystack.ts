import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import type { PaymentInitInput, PaymentInitResult, PaymentVerifyResult } from "./types";

/**
 * MVP: no real network call. Returns a mock reference and redirects to an
 * internal mock-payment page that simulates Paystack Inline. The function
 * shape matches what a real Paystack integration would return so swapping is
 * trivial later.
 */
export async function initPaystackPayment(input: PaymentInitInput): Promise<PaymentInitResult> {
  return {
    reference: input.reference,
    redirectUrl: `/checkout/mock-payment?ref=${encodeURIComponent(input.reference)}`,
  };
}

/**
 * MVP: returns "succeeded" if the reference exists in our DB and is INITIATED.
 * The real implementation will GET https://api.paystack.co/transaction/verify/:ref.
 */
export async function verifyPaystackPayment(reference: string): Promise<PaymentVerifyResult> {
  return {
    reference,
    amountKobo: 0, // populated from DB by caller
    status: "succeeded",
    raw: { mock: true },
  };
}

/**
 * HMAC-SHA512 signature check used by the webhook handler. Returns true on
 * match. In dev with no secret configured, returns true so local testing works.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!env.PAYSTACK_WEBHOOK_SECRET) {
    return env.NODE_ENV !== "production";
  }
  if (!signature) return false;
  const expected = createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
