import { z } from "zod";

export const createMeterSchema = z
  .object({
    property: z.string().min(1),
    kind: z.enum(["main", "sub"]),
    utilityType: z.enum(["electricity", "water", "gas"]),
    unit: z.string().min(1).optional(),
    parentMeter: z.string().min(1).optional(),
    label: z.string().min(1),
    meterNumber: z.string().optional(),
  })
  .refine((input) => (input.kind === "sub" ? Boolean(input.unit && input.parentMeter) : true), {
    message: "A sub-meter requires both a unit and a parent (main) meter",
  });
