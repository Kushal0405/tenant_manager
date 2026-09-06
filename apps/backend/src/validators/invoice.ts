import { z } from "zod";

export const createChargeSchema = z.object({
  lease: z.string().min(1),
  // Any date within the target billing period; defaults to the lease's current period.
  periodDate: z.coerce.date().optional(),
  type: z.enum(["late_fee", "utility", "maintenance", "custom"]),
  description: z.string().min(1),
  amountMinor: z.number().int().min(1),
});
