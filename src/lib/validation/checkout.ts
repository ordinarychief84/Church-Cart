import { z } from "zod";

export const checkoutSchema = z
  .object({
    deliveryType: z.enum(["HOME_DELIVERY", "CHURCH_PICKUP"]),
    deliveryAddress: z.string().max(200).optional().or(z.literal("")),
    deliveryCity: z.string().max(60).optional().or(z.literal("")),
    deliveryState: z.string().max(60).optional().or(z.literal("")),
    churchBranchId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      d.deliveryType !== "HOME_DELIVERY" ||
      (!!d.deliveryAddress && !!d.deliveryCity && !!d.deliveryState),
    { message: "Delivery address, city and state required for home delivery", path: ["deliveryAddress"] }
  )
  .refine((d) => d.deliveryType !== "CHURCH_PICKUP" || !!d.churchBranchId, {
    message: "Choose a church pickup branch",
    path: ["churchBranchId"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
