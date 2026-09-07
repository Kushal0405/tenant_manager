import { z } from "zod";

export const incomeStatementQuerySchema = z.object({
  scope: z.enum(["portfolio", "property", "unit"]).default("portfolio"),
  scopeId: z.string().optional(),
  periodType: z.enum(["monthly", "yearly"]).default("monthly"),
});
