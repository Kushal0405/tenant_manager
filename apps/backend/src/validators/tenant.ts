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

// Link to an existing account by id, or create+link a new one by name+email.
export const linkTenantSchema = z
  .object({
    userId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((v) => Boolean(v.userId) || Boolean(v.name && v.email), {
    message: "Provide either userId, or both name and email",
  });
