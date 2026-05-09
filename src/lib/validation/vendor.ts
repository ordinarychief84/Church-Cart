import { z } from "zod";
import { normalizeNgPhone } from "./auth";

export const vendorProfileSchema = z.object({
  businessName: z.string().min(2).max(80),
  cacNumber: z.string().max(40).optional().or(z.literal("")),
  churchAffiliation: z.string().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .transform((v) => normalizeNgPhone(v))
    .pipe(
      z
        .string()
        .regex(/^\+234[0-9]{10}$/, "Use a Nigerian phone number, e.g. 08012345678 or +2348012345678")
    ),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const productSchema = z
  .object({
    title: z.string().min(2).max(120),
    description: z.string().min(10).max(4000),
    // Naira input from the vendor form, e.g. "2500.00". We convert to kobo
    // (Int) below so the rest of the system can stay in kobo throughout.
    priceNaira: z.coerce.number().positive().max(10_000_000),
    inventoryQty: z.coerce.number().int().min(0).max(100_000),
    categoryId: z.string().min(1),
    available: z.coerce.boolean().default(true),
    isDigital: z.coerce.boolean().default(false),
    weightGrams: z.coerce.number().int().min(0).max(500_000).optional().nullable(),
  })
  .transform(({ priceNaira, ...rest }) => ({
    ...rest,
    priceKobo: Math.round(priceNaira * 100),
  }));

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
export type ProductInput = z.infer<typeof productSchema>;
