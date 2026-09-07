import { z } from "zod";

export const createExpenseSchema = z.object({
  property: z.string().min(1),
  category: z.enum(["repair", "utility", "tax", "insurance", "management_fee", "other"]),
  amountMinor: z.number().int().min(1),
  date: z.coerce.date(),
  note: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ property: true });
