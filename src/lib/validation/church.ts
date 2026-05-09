import { z } from "zod";
import { normalizeNgPhone } from "./auth";

export const churchBranchSchema = z.object({
  churchName: z.string().min(2).max(80),
  denomination: z.string().min(2).max(60),
  branchName: z.string().min(2).max(120),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  contactPerson: z.string().min(2).max(80),
  contactPhone: z
    .string()
    .transform((v) => normalizeNgPhone(v))
    .pipe(
      z
        .string()
        .regex(/^\+234[0-9]{10}$/, "Use a Nigerian phone number, e.g. 08012345678 or +2348012345678")
    ),
  operatingDays: z.string().min(2).max(40),
  operatingHours: z.string().min(2).max(40),
  pickupCapacity: z.coerce.number().int().min(1).max(10_000).default(50),
});

export type ChurchBranchInput = z.infer<typeof churchBranchSchema>;
