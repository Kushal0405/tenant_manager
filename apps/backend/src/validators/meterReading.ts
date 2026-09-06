import { z } from "zod";

export const createMeterReadingSchema = z.object({
  unit: z.string().min(1),
  meterType: z.enum(["electricity", "water", "gas"]),
  readingDate: z.coerce.date(),
  currentReadingValue: z.number().min(0),
  ratePerUnitMinor: z.number().int().min(0),
  note: z.string().optional(),
});

export const billMeterReadingSchema = z.object({
  lease: z.string().min(1),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});
