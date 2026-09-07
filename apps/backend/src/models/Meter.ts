import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const meterSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    // Required for a "sub" meter (which unit it serves); absent for "main" (covers the whole property).
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
    kind: { type: String, enum: ["main", "sub"], required: true },
    utilityType: { type: String, enum: ["electricity", "water", "gas"], required: true },
    // Required for a "sub" meter — the property's main meter of the same utility type.
    parentMeter: { type: Schema.Types.ObjectId, ref: "Meter" },
    label: { type: String, required: true, trim: true },
    meterNumber: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

meterSchema.index({ property: 1, kind: 1, utilityType: 1 });
meterSchema.index({ unit: 1 });
// At most one main meter per property per utility type.
meterSchema.index(
  { property: 1, utilityType: 1 },
  { unique: true, partialFilterExpression: { kind: "main" } },
);

applyIdTransform(meterSchema);

export type MeterDoc = InferSchemaType<typeof meterSchema> & { _id: Types.ObjectId };
export const Meter = model("Meter", meterSchema);
