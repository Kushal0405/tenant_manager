import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const invoiceLineItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["rent", "late_fee", "utility", "maintenance", "custom"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    lease: { type: Schema.Types.ObjectId, ref: "Lease", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true }, // display label for the period, e.g. "2026-03" or "2026-Q1"
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    lineItems: { type: [invoiceLineItemSchema], default: [] },
    subtotalMinor: { type: Number, required: true, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    amountPaidMinor: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
      required: true,
    },
    lateFeeApplied: { type: Boolean, default: false, required: true },
    isBackfilled: { type: Boolean, default: false, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

invoiceSchema.index({ lease: 1, periodStart: 1 }, { unique: true });
invoiceSchema.index({ owner: 1, status: 1 });

applyIdTransform(invoiceSchema);

export type InvoiceDoc = InferSchemaType<typeof invoiceSchema> & { _id: Types.ObjectId };
export const Invoice = model("Invoice", invoiceSchema);
