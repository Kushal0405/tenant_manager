import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const unitSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    sqft: { type: Number, required: true, min: 0 },
    baseRentMinor: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["vacant", "occupied"], default: "vacant", required: true },
    // Which floor this unit is on — only used for "flat" properties.
    floor: { type: Number, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

unitSchema.index({ owner: 1, status: 1 });

applyIdTransform(unitSchema);

export type UnitDoc = InferSchemaType<typeof unitSchema> & { _id: Types.ObjectId };
export const Unit = model("Unit", unitSchema);
