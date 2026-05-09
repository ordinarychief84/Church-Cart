export type Address = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

export type QuoteInput = {
  origin: Address;
  destination: Address;
  weightGrams: number;
  isDigital: boolean;
  isChurchPickup: boolean;
};

export type LogisticsQuote = {
  provider: string;
  amountKobo: number;
  etaDays: number;
};

export type CreateShipmentInput = {
  orderId: string;
  origin: Address;
  destination: Address;
  weightGrams: number;
  isChurchPickup: boolean;
};

export type ShipmentResult = {
  provider: string;
  externalId: string;
  trackingUrl: string;
  quoteKobo: number;
  status: string;
};

export type TrackingEvent = {
  at: string;
  status: string;
  note?: string;
};

export type TrackingResult = {
  status: string;
  events: TrackingEvent[];
};

export interface LogisticsProvider {
  getDeliveryQuote(input: QuoteInput): Promise<LogisticsQuote>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  trackShipment(externalId: string): Promise<TrackingResult>;
}
