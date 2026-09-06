import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const tenantSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    idProofType: { type: String, trim: true },
    idProofNumber: { type: String, trim: true },
    // Set when this tenant record IS the app's own logged-in user (they're
    // renting a place themselves and marked themselves as the lessee).
    linkedUser: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applyIdTransform(tenantSchema);

export type TenantDoc = InferSchemaType<typeof tenantSchema> & { _id: Types.ObjectId };
export const Tenant = model("Tenant", tenantSchema);
