import { Schema, model, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner"], default: "owner", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

applyIdTransform(userSchema, ["passwordHash"]);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
