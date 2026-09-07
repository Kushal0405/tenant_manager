import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { applyIdTransform } from "./toJSONPlugin.js";

const utilityMeterReadingSchema = new Schema(
  {
    meter: { type: Schema.Types.ObjectId, ref: "Meter", required: true, index: true },
    // Denormalized from the meter for querying: absent for a reading on a main meter.
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meterType: { type: String, enum: ["electricity", "water", "gas"], required: true },
    readingDate: { type: Date, required: true },
    previousReadingValue: { type: Number, required: true, min: 0 },
    currentReadingValue: { type: Number, required: true, min: 0 },
    unitsConsumed: { type: Number, required: true, min: 0 },
    ratePerUnitMinor: { type: Number, required: true, min: 0 },
    amountMinor: { type: Number, required: true, min: 0 },
    billed: { type: Boolean, default: false, required: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice" },
    note: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

utilityMeterReadingSchema.index({ meter: 1, readingDate: -1 });

applyIdTransform(utilityMeterReadingSchema);

export type UtilityMeterReadingDoc = InferSchemaType<typeof utilityMeterReadingSchema> & {
  _id: Types.ObjectId;
};
export const UtilityMeterReading = model("UtilityMeterReading", utilityMeterReadingSchema);
