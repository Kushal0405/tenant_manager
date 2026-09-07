import { Schema, model, Types, type InferSchemaType } from "mongoose";

const tenantSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    idProofType: { type: String, trim: true },
    idProofNumber: { type: String, trim: true },
    // Set when this tenant record is linked to an app user account — either the
    // owner themselves (they're renting a place and marked themselves as the
    // lessee) or another registered user the owner has invited/linked so the
    // tenant can log in and see their own ledger.
    linkedUser: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The wire shape (@rent-manager/shared) exposes the link as `linkedUserId`, plus
// the linked user's name/email when the doc was populated. Keep that mapping here
// so every JSON response is consistent regardless of the query that produced it.
tenantSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = (ret._id as { toString(): string }).toString();
    delete ret._id;

    const linked = ret.linkedUser as
      | { _id?: { toString(): string }; id?: string; name?: string; email?: string }
      | { toString(): string }
      | null
      | undefined;
    if (linked && typeof linked === "object" && ("name" in linked || "email" in linked)) {
      const l = linked as {
        _id?: { toString(): string };
        id?: string;
        name?: string;
        email?: string;
      };
      ret.linkedUserId = l.id ?? l._id?.toString();
      ret.linkedUserName = l.name;
      ret.linkedUserEmail = l.email;
    } else if (linked) {
      ret.linkedUserId = (linked as { toString(): string }).toString();
    }
    delete ret.linkedUser;
    return ret;
  },
});

export type TenantDoc = InferSchemaType<typeof tenantSchema> & { _id: Types.ObjectId };
export const Tenant = model("Tenant", tenantSchema);
