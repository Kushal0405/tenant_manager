import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

export const createPropertySchema = z.object({
  name: z.string().min(1),
  address: addressSchema,
  type: z.enum(["residential", "commercial", "mixed"]),
});

export const updatePropertySchema = createPropertySchema.partial();
