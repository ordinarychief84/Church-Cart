import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_ISSUER: z.string().default("churchcart"),
  COOKIE_NAME: z.string().default("cc_session"),
  COOKIE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  LOGISTICS_PROVIDER: z.enum(["mock", "shipbubble", "gig", "kwik"]).default("mock"),
  NOTIFICATIONS_EMAIL_PROVIDER: z.enum(["off", "resend"]).default("off"),
  RESEND_API_KEY: z.string().optional(),
  NOTIFICATIONS_SMS_PROVIDER: z.enum(["off", "termii", "africastalking"]).default("off"),
  NOTIFICATIONS_WHATSAPP_PROVIDER: z.enum(["off", "twilio", "meta"]).default("off"),
  PLATFORM_FEE_BPS: z.coerce.number().int().nonnegative().default(500),
  DISPUTE_WINDOW_HOURS: z.coerce.number().int().nonnegative().default(48),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. See errors above.");
}

export const env = parsed.data;
