import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const paymentSchema = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    lease: { type: Schema.Types.ObjectId, ref: "Lease", required: true, index: true },
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountMinor: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ["cash", "bank", "upi", "card"], required: true },
    date: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applyIdTransform(paymentSchema);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId };
export const Payment = model("Payment", paymentSchema);
