import { z } from "zod";

export const churchBranchSchema = z.object({
  churchName: z.string().min(2).max(80),
  denomination: z.string().min(2).max(60),
  branchName: z.string().min(2).max(120),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  contactPerson: z.string().min(2).max(80),
  contactPhone: z.string().regex(/^\+234[0-9]{10}$/, "Phone must be E.164 +234..."),
  operatingDays: z.string().min(2).max(40),
  operatingHours: z.string().min(2).max(40),
  pickupCapacity: z.coerce.number().int().min(1).max(10_000).default(50),
});

export type ChurchBranchInput = z.infer<typeof churchBranchSchema>;
