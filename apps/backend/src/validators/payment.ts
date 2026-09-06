import { z } from "zod";

export const recordPaymentSchema = z.object({
  invoice: z.string().min(1),
  amountMinor: z.number().int().min(1),
  method: z.enum(["cash", "bank", "upi", "card"]),
  date: z.coerce.date(),
  note: z.string().optional(),
});
