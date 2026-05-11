import { z } from "zod";

const DENOMINATIONS = [
  "RCCG",
  "WINNERS_CHAPEL",
  "MFM",
  "CAC",
  "DEEPER_LIFE",
  "CATHOLIC",
  "ANGLICAN",
  "METHODIST",
  "PRESBYTERIAN",
  "OTHER",
] as const;

const PRODUCT_TYPES = ["COURSE", "EBOOK", "TEMPLATE", "OTHER"] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function uniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  const slug = slugify(base);
  return slug ? `${slug}-${suffix}` : `item-${suffix}`;
}

export const sellerProfileSchema = z.object({
  business_name: z.string().trim().min(2, "Tell us your business name").max(80),
  cac_number: z.string().trim().max(40).optional().or(z.literal("")),
  church_affiliation: z.enum(DENOMINATIONS).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(10, "Phone must be 10-14 digits")
    .max(14)
    .regex(/^\+?[0-9]{10,14}$/, "Phone must be 10-14 digits, e.g. 08012345678"),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;

// Paystack payment URLs come in two flavours:
//   https://paystack.com/pay/<slug>
//   https://paystack.shop/<vendor>
// We accept both and reject anything else.
const paystackUrlRegex = /^https:\/\/(paystack\.com|paystack\.shop)\/.+/i;

export const productSchema = z
  .object({
    title: z.string().trim().min(2, "Pick a clear title").max(120),
    description: z
      .string()
      .trim()
      .min(20, "Add at least 20 characters so buyers know what they're getting")
      .max(4000),
    category_id: z.string().uuid("Pick a category"),
    product_type: z.enum(PRODUCT_TYPES),
    price_naira: z.coerce
      .number({ invalid_type_error: "Set a price in Naira" })
      .positive("Price must be greater than zero")
      .max(10_000_000, "Price looks too high — double-check"),
    paystack_payment_url: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || paystackUrlRegex.test(v),
        "Use a Paystack URL like https://paystack.com/pay/your-link"
      ),
    cover_image_url: z.string().url().optional().or(z.literal("")),
    available: z.coerce.boolean().default(true),
    is_digital: z.coerce.boolean().default(true),
    inventory_qty: z.coerce.number().int().nonnegative().max(100_000).default(0),
    weight_grams: z.coerce.number().int().nonnegative().max(500_000).optional().nullable(),
    // Multi-select of church_branch IDs (for physical products only). Stored
    // as a comma-separated string in the FormData, parsed here.
    pickup_branch_ids: z
      .string()
      .optional()
      .transform((v) =>
        v
          ? v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      )
      .pipe(z.array(z.string().uuid("Invalid branch id"))),
  })
  .refine(
    (d) => d.is_digital || d.pickup_branch_ids.length > 0,
    {
      message: "Physical products need at least one pickup location",
      path: ["pickup_branch_ids"],
    }
  )
  .refine(
    (d) => d.is_digital || d.inventory_qty > 0,
    {
      message: "Set how many units you have in stock",
      path: ["inventory_qty"],
    }
  )
  .transform((d) => ({
    ...d,
    price_kobo: Math.round(d.price_naira * 100),
  }));

export type ProductInput = z.infer<typeof productSchema>;

export const DENOMINATION_LABELS: Record<(typeof DENOMINATIONS)[number], string> = {
  RCCG: "RCCG",
  WINNERS_CHAPEL: "Winners Chapel",
  MFM: "MFM",
  CAC: "CAC",
  DEEPER_LIFE: "Deeper Life",
  CATHOLIC: "Catholic",
  ANGLICAN: "Anglican",
  METHODIST: "Methodist",
  PRESBYTERIAN: "Presbyterian",
  OTHER: "Other",
};

// Operating-days field is a freeform string ("Mon-Fri,Sun") but we enforce a
// minimum to catch obvious misuse like "X" or empty.
const operatingDaysRegex = /[A-Za-z]/;

export const churchBranchSchema = z.object({
  branch_name: z.string().trim().min(2, "Tell us the branch name").max(120),
  denomination: z.enum(DENOMINATIONS),
  address: z.string().trim().min(5, "Address looks too short").max(200),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  contact_person: z.string().trim().min(2).max(80),
  contact_phone: z
    .string()
    .trim()
    .min(10, "Phone must be 10-14 digits")
    .max(14)
    .regex(/^\+?[0-9]{10,14}$/, "Phone must be 10-14 digits, e.g. 08012345678"),
  operating_days: z
    .string()
    .trim()
    .min(2, "Pick at least one day")
    .max(40)
    .regex(operatingDaysRegex, "Use day names like Mon-Fri,Sun"),
  operating_hours: z
    .string()
    .trim()
    .regex(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, "Use 24-hour HH:MM-HH:MM, e.g. 09:00-18:00"),
  pickup_capacity: z.coerce
    .number({ invalid_type_error: "Capacity must be a number" })
    .int()
    .min(1, "Capacity must be at least 1")
    .max(10_000, "Capacity looks too high"),
});

export type ChurchBranchInput = z.infer<typeof churchBranchSchema>;

export const homeChurchSchema = z.object({
  // Empty string clears the home church.
  home_church_branch_id: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .pipe(z.string().uuid().nullable()),
});

export const placePickupOrderSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid(),
});

export { DENOMINATIONS, PRODUCT_TYPES };
