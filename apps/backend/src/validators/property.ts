import { z } from "zod";

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

const landlordSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const selfLeaseSchema = z.object({
  tenantPhone: z.string().min(1),
  rentAmountMinor: z.number().int().min(0),
  depositAmountMinor: z.number().int().min(0).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  dueDayOfMonth: z.number().int().min(1).max(31),
  rentFrequency: z.enum(["monthly", "quarterly", "half_yearly", "yearly"]).default("monthly"),
});

const basePropertySchema = z.object({
  name: z.string().min(1),
  address: addressSchema,
  type: z.enum(["flat", "hall", "plot", "shop"]),
  myRole: z.enum(["owner", "lessee"]).default("owner"),
  numberOfFloors: z.number().int().min(1).optional(),
  landlord: landlordSchema.optional(),
  selfLease: selfLeaseSchema.optional(),
});

export const createPropertySchema = basePropertySchema
  .refine((input) => input.myRole !== "owner" || input.type !== "flat" || input.numberOfFloors !== undefined, {
    message: "numberOfFloors is required for flats you own",
  })
  .refine((input) => input.myRole !== "lessee" || input.landlord !== undefined, {
    message: "landlord contact info is required when you're the lessee",
  })
  .refine((input) => input.myRole !== "lessee" || input.selfLease !== undefined, {
    message: "rent details are required when you're the lessee",
  });

export const updatePropertySchema = basePropertySchema
  .omit({ myRole: true, landlord: true, selfLease: true })
  .partial();
