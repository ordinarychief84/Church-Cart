import { randomUUID } from "crypto";
import {
  initPaystackPayment,
  verifyPaystackPayment,
  verifyPaystackSignature,
} from "./paystack";
import type { PaymentInitInput, PaymentInitResult, PaymentVerifyResult } from "./types";

export function generatePaymentReference(): string {
  return `cc_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export async function createPaymentIntent(input: PaymentInitInput): Promise<PaymentInitResult> {
  return initPaystackPayment(input);
}

export async function verifyPayment(reference: string): Promise<PaymentVerifyResult> {
  return verifyPaystackPayment(reference);
}

export { verifyPaystackSignature };
export type * from "./types";
