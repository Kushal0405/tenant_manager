import { z } from "zod";

export const createUnitSchema = z.object({
  property: z.string().min(1),
  label: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqft: z.number().min(0),
  baseRentMinor: z.number().int().min(0),
});

export const updateUnitSchema = createUnitSchema.partial().omit({ property: true });
