import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  alternatePhone: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();
