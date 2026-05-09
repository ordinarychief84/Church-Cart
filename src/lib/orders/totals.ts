import { env } from "@/lib/env";

export type LineInput = { priceKobo: number; quantity: number };

export type OrderTotals = {
  subtotalKobo: number;
  platformFeeKobo: number;
  vendorAmountKobo: number;
  logisticsFeeKobo: number;
  totalKobo: number;
};

export function computeOrderTotals(items: LineInput[], logisticsFeeKobo: number): OrderTotals {
  const subtotalKobo = items.reduce((sum, l) => sum + l.priceKobo * l.quantity, 0);
  const platformFeeKobo = Math.floor((subtotalKobo * env.PLATFORM_FEE_BPS) / 10_000);
  const vendorAmountKobo = subtotalKobo - platformFeeKobo;
  const totalKobo = subtotalKobo + logisticsFeeKobo;
  return { subtotalKobo, platformFeeKobo, vendorAmountKobo, logisticsFeeKobo, totalKobo };
}
