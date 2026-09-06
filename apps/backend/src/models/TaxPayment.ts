import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const taxPaymentSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taxType: {
      type: String,
      enum: ["property_tax", "gst", "tds", "other"],
      required: true,
    },
    period: { type: String, required: true, trim: true }, // e.g. "2025-2026" or "2026-Q1"
    amountMinor: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
      required: true,
    },
    receiptNumber: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

taxPaymentSchema.index({ owner: 1, status: 1 });
taxPaymentSchema.index({ property: 1, period: 1 });

applyIdTransform(taxPaymentSchema);

export type TaxPaymentDoc = InferSchemaType<typeof taxPaymentSchema> & { _id: Types.ObjectId };
export const TaxPayment = model("TaxPayment", taxPaymentSchema);
