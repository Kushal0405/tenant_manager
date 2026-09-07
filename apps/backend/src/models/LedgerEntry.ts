import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const ledgerEntrySchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    lease: { type: Schema.Types.ObjectId, ref: "Lease", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["charge", "payment", "credit", "deposit", "deposit_deduction"],
      required: true,
    },
    // signed: charge/deposit are positive (increase balance owed),
    // payment/credit/deposit_deduction are negative (decrease it)
    amountMinor: { type: Number, required: true },
    runningBalanceMinor: { type: Number, required: true },
    refInvoice: { type: Schema.Types.ObjectId, ref: "Invoice" },
    refPayment: { type: Schema.Types.ObjectId, ref: "Payment" },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ledgerEntrySchema.index({ tenant: 1, date: 1 });

applyIdTransform(ledgerEntrySchema);

export type LedgerEntryDoc = InferSchemaType<typeof ledgerEntrySchema> & { _id: Types.ObjectId };
export const LedgerEntry = model("LedgerEntry", ledgerEntrySchema);
