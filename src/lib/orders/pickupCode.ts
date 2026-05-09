import { randomUUID, randomInt } from "crypto";

/**
 * Generates a 6-digit human-readable pickup code (e.g. "428193") and a UUID
 * token used for QR codes. The two are stored on the Order.
 */
export function generatePickupCode(): { code: string; token: string } {
  // Avoid leading zero so the code is always 6 chars when displayed.
  const code = String(randomInt(100000, 999999));
  return { code, token: randomUUID() };
}
