import { z } from "zod";

export const vendorProfileSchema = z.object({
  businessName: z.string().min(2).max(80),
  cacNumber: z.string().max(40).optional().or(z.literal("")),
  churchAffiliation: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().regex(/^\+234[0-9]{10}$/, "Phone must be E.164 +234..."),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export const productSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(4000),
  priceKobo: z.coerce.number().int().positive().max(1_000_000_000),
  inventoryQty: z.coerce.number().int().min(0).max(100_000),
  categoryId: z.string().min(1),
  available: z.coerce.boolean().default(true),
  isDigital: z.coerce.boolean().default(false),
  weightGrams: z.coerce.number().int().min(0).max(500_000).optional().nullable(),
});

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
export type ProductInput = z.infer<typeof productSchema>;
