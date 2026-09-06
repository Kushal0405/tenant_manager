import { z } from "zod";

const lateFeeRuleSchema = z
  .object({
    graceDays: z.number().int().min(0),
    feeType: z.enum(["flat", "percent"]),
    feeValueMinor: z.number().int().min(0).optional(),
    feePercent: z.number().min(0).optional(),
  })
  .refine(
    (rule) =>
      rule.feeType === "flat" ? rule.feeValueMinor !== undefined : rule.feePercent !== undefined,
    { message: "feeValueMinor is required for flat fees, feePercent for percent fees" },
  );

export const createLeaseSchema = z.object({
  unit: z.string().min(1),
  tenant: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmountMinor: z.number().int().min(0),
  depositAmountMinor: z.number().int().min(0),
  dueDayOfMonth: z.number().int().min(1).max(31),
  lateFeeRule: lateFeeRuleSchema,
});

export const amendLeaseSchema = z.object({
  effectiveDate: z.coerce.date(),
  reason: z.string().optional(),
  changes: z
    .object({
      rentAmountMinor: z.number().int().min(0).optional(),
      depositAmountMinor: z.number().int().min(0).optional(),
      dueDayOfMonth: z.number().int().min(1).max(31).optional(),
      endDate: z.coerce.date().optional(),
      lateFeeRule: lateFeeRuleSchema.optional(),
    })
    .refine((changes) => Object.keys(changes).length > 0, {
      message: "At least one field must change",
    }),
});

export const terminateLeaseSchema = z.object({
  terminatedAt: z.coerce.date(),
  depositReturnedMinor: z.number().int().min(0),
  depositDeductionNote: z.string().optional(),
});
