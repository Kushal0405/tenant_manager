import { z } from "zod";

export const createChargeSchema = z.object({
  lease: z.string().min(1),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  type: z.enum(["late_fee", "utility", "maintenance", "custom"]),
  description: z.string().min(1),
  amountMinor: z.number().int().min(1),
});
