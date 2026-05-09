import { z } from "zod";

const phoneRegex = /^\+234[0-9]{10}$/;

/**
 * Accepts:
 *   +2348012345678
 *   2348012345678
 *   08012345678 / 8012345678
 *   spaces / dashes / parens are stripped
 * Returns "" if blank input, the canonical "+234XXXXXXXXXX" string if it
 * looks like a Nigerian number, or the original (cleaned) string for the
 * regex check to reject below.
 */
export function normalizeNgPhone(input: string): string {
  const cleaned = input.replace(/[\s()\-]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+234") && cleaned.length === 14) return cleaned;
  if (cleaned.startsWith("234") && cleaned.length === 13) return `+${cleaned}`;
  if (cleaned.startsWith("0") && cleaned.length === 11) return `+234${cleaned.slice(1)}`;
  if (cleaned.length === 10 && /^[0-9]+$/.test(cleaned)) return `+234${cleaned}`;
  return cleaned;
}

const phoneField = z
  .string()
  .transform((v) => (v ? normalizeNgPhone(v) : ""))
  .pipe(
    z
      .string()
      .regex(phoneRegex, "Use a Nigerian phone number, e.g. 08012345678 or +2348012345678")
      .or(z.literal(""))
  );

export const identifierSchema = z
  .string()
  .min(3)
  .transform((v) => v.trim())
  .refine(
    (v) =>
      z.string().email().safeParse(v).success ||
      phoneRegex.test(normalizeNgPhone(v)),
    "Use a valid email or Nigerian phone number"
  )
  .transform((v) =>
    v.includes("@") ? v.toLowerCase() : normalizeNgPhone(v)
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name required").max(80),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: phoneField,
    password: passwordSchema,
    role: z.enum(["BUYER", "VENDOR", "CHURCH_ADMIN"]),
  })
  .refine((d) => !!(d.email && d.email.length) || !!(d.phone && d.phone.length), {
    message: "Provide either an email or a phone number",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Password required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
