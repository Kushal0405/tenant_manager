import { z } from "zod";

export const createMeterReadingSchema = z.object({
  meter: z.string().min(1),
  readingDate: z.coerce.date(),
  currentReadingValue: z.number().min(0),
  ratePerUnitMinor: z.number().int().min(0),
  note: z.string().optional(),
});

export const billMeterReadingSchema = z.object({
  lease: z.string().min(1),
  // Any date within the target billing period; defaults to the lease's current period.
  periodDate: z.coerce.date().optional(),
});
