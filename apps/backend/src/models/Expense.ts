import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const expenseSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: ["repair", "utility", "tax", "insurance", "management_fee", "other"],
      required: true,
    },
    amountMinor: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

expenseSchema.index({ property: 1, date: 1 });

applyIdTransform(expenseSchema);

export type ExpenseDoc = InferSchemaType<typeof expenseSchema> & { _id: Types.ObjectId };
export const Expense = model("Expense", expenseSchema);
