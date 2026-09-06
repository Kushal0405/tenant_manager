import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const lateFeeRuleSchema = new Schema(
  {
    graceDays: { type: Number, required: true, min: 0 },
    feeType: { type: String, enum: ["flat", "percent"], required: true },
    feeValueMinor: { type: Number, min: 0 },
    feePercent: { type: Number, min: 0 },
  },
  { _id: false },
);

// Snapshot of the editable terms changed by an amendment, so the lease's
// full history of rent revisions / renewals / due-day changes is auditable.
const leaseAmendmentSchema = new Schema(
  {
    effectiveDate: { type: Date, required: true },
    changes: {
      rentAmountMinor: { type: Number, min: 0 },
      depositAmountMinor: { type: Number, min: 0 },
      dueDayOfMonth: { type: Number, min: 1, max: 31 },
      endDate: { type: Date },
      lateFeeRule: { type: lateFeeRuleSchema },
      rentFrequency: { type: String, enum: ["monthly", "quarterly", "half_yearly", "yearly"] },
    },
    reason: { type: String, trim: true },
    amendedAt: { type: Date, default: () => new Date(), required: true },
  },
  { _id: false },
);

const leaseSchema = new Schema(
  {
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true, index: true },
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    rentAmountMinor: { type: Number, required: true, min: 0 },
    depositAmountMinor: { type: Number, required: true, min: 0 },
    dueDayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    rentFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "half_yearly", "yearly"],
      default: "monthly",
      required: true,
    },
    lateFeeRule: { type: lateFeeRuleSchema, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "terminated"],
      default: "active",
      required: true,
      index: true,
    },
    terminatedAt: { type: Date },
    depositReturnedMinor: { type: Number, min: 0 },
    depositDeductionNote: { type: String, trim: true },
    amendments: { type: [leaseAmendmentSchema], default: [] },
    // Set once the historical-rent backfill has run (rentStartDate was in the
    // past at creation) — the date up to which past invoices were generated.
    backfilledThrough: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

leaseSchema.index({ owner: 1, status: 1 });

applyIdTransform(leaseSchema);

export type LeaseDoc = InferSchemaType<typeof leaseSchema> & { _id: Types.ObjectId };
export const Lease = model("Lease", leaseSchema);
