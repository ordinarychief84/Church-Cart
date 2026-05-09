import { randomUUID } from "crypto";
import type {
  LogisticsProvider,
  QuoteInput,
  CreateShipmentInput,
  TrackingResult,
} from "./types";

const HOME_FEE_KOBO = 150_000; // ₦1,500
const CHURCH_FEE_KOBO = 80_000; // ₦800

export const mockProvider: LogisticsProvider = {
  async getDeliveryQuote(input: QuoteInput) {
    if (input.isDigital) return { provider: "mock", amountKobo: 0, etaDays: 0 };
    return {
      provider: "mock",
      amountKobo: input.isChurchPickup ? CHURCH_FEE_KOBO : HOME_FEE_KOBO,
      etaDays: input.isChurchPickup ? 4 : 3,
    };
  },
  async createShipment(input: CreateShipmentInput) {
    return {
      provider: "mock",
      externalId: `mock_${randomUUID()}`,
      trackingUrl: "#",
      quoteKobo: input.isChurchPickup ? CHURCH_FEE_KOBO : HOME_FEE_KOBO,
      status: "created",
    };
  },
  async trackShipment(_externalId: string): Promise<TrackingResult> {
    return { status: "in_transit", events: [] };
  },
};
