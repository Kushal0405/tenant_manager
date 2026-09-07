import type { Schema } from "mongoose";

/**
 * Exposes Mongo's _id as a plain string `id` (matching the wire types in
 * @rent-manager/shared), drops the internal __v key, and lets each schema
 * redact any additional fields (e.g. User.passwordHash) from its JSON output.
 */
export function applyIdTransform(schema: Schema, redact: string[] = []) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string }).toString();
      delete ret._id;
      for (const field of redact) {
        delete ret[field];
      }
      return ret;
    },
  });
}
