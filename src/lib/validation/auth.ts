import { z } from "zod";

const phoneRegex = /^\+234[0-9]{10}$/;

export const identifierSchema = z
  .string()
  .min(3)
  .refine(
    (v) => z.string().email().safeParse(v).success || phoneRegex.test(v),
    "Use a valid email or Nigerian phone number (+234...)"
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name required").max(80),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().regex(phoneRegex, "Phone must be E.164 +234XXXXXXXXXX").optional().or(z.literal("")),
    password: passwordSchema,
    role: z.enum(["BUYER", "VENDOR", "CHURCH_ADMIN"]),
  })
  .refine((d) => !!(d.email && d.email.length) || !!(d.phone && d.phone.length), {
    message: "Provide either email or phone",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Password required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
