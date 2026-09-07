import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const propertySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: addressSchema, required: true },
    type: {
      type: String,
      enum: ["flat", "hall", "plot", "shop"],
      required: true,
    },
    // Whether this account owns the property (manages units/leases/billing)
    // or is the lessee renting it from an outside landlord.
    myRole: { type: String, enum: ["owner", "lessee"], default: "owner", required: true },
    // Only meaningful for type "flat" and myRole "owner".
    numberOfFloors: { type: Number, min: 1 },
    // Only set when myRole is "lessee" — the actual landlord, who may not use this app.
    landlordName: { type: String, trim: true },
    landlordPhone: { type: String, trim: true },
    landlordEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applyIdTransform(propertySchema);

export type PropertyDoc = InferSchemaType<typeof propertySchema> & { _id: Types.ObjectId };
export const Property = model("Property", propertySchema);
