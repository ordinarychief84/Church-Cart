export type PaymentInitInput = {
  reference: string;
  amountKobo: number;
  email?: string;
  callbackUrl: string;
};

export type PaymentInitResult = {
  reference: string;
  redirectUrl: string;
};

export type PaymentVerifyResult = {
  reference: string;
  amountKobo: number;
  status: "succeeded" | "failed" | "pending";
  raw: unknown;
};
