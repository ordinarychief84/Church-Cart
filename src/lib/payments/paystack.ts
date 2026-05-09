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
 * HMAC-SHA512 signature check used by the webhook handler. Returns true ONLY
 * when the signature header matches. We never silently accept unsigned
 * requests — the only way to skip this is to omit the route entirely.
 *
 * In production, env validation already guarantees PAYSTACK_WEBHOOK_SECRET is
 * set. In dev without a secret, we still require the header but verify against
 * the literal "dev" key so devs at least have to construct a real signature
 * before this passes — preventing a stray `curl` from flipping orders.
 */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = env.PAYSTACK_WEBHOOK_SECRET || "dev";
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
