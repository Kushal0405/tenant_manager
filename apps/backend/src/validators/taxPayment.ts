import { z } from "zod";

export const createTaxPaymentSchema = z.object({
  property: z.string().min(1),
  taxType: z.enum([
    "property_tax",
    "gst",
    "tds",
    "water_bill",
    "electricity_bill",
    "gas_bill",
    "other",
  ]),
  period: z.string().min(1),
  amountMinor: z.number().int().min(1),
  dueDate: z.coerce.date(),
  receiptNumber: z.string().optional(),
  note: z.string().optional(),
});

export const updateTaxPaymentSchema = createTaxPaymentSchema.partial().omit({ property: true });

export const markTaxPaymentPaidSchema = z.object({
  paidDate: z.coerce.date(),
  receiptNumber: z.string().optional(),
});
