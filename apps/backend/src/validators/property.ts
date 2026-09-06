import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

const basePropertySchema = z.object({
  name: z.string().min(1),
  address: addressSchema,
  type: z.enum(["flat", "hall", "plot", "shop"]),
  numberOfFloors: z.number().int().min(1).optional(),
});

export const createPropertySchema = basePropertySchema.refine(
  (input) => input.type !== "flat" || input.numberOfFloors !== undefined,
  { message: "numberOfFloors is required for flats" },
);

export const updatePropertySchema = basePropertySchema.partial();
