import type { Request, Response } from "express";
import { Lease, Unit, UtilityMeterReading } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import {
  addLineItemToInvoice,
  getOrCreateMonthlyInvoice,
  monthKey,
} from "../services/billingService.js";
import { billMeterReadingSchema, createMeterReadingSchema } from "../validators/meterReading.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.unit) filter.unit = req.query.unit;
  if (req.query.meterType) filter.meterType = req.query.meterType;
  if (req.query.billed !== undefined) filter.billed = req.query.billed === "true";
  const readings = await UtilityMeterReading.find(filter).sort({ readingDate: -1 });
  res.json(readings);
}

export async function create(req: Request, res: Response) {
  const input = createMeterReadingSchema.parse(req.body);

  const unit = await Unit.findOne({ _id: input.unit, owner: req.userId });
  if (!unit) throw notFound("Unit");

  const lastReading = await UtilityMeterReading.findOne({
    unit: input.unit,
    meterType: input.meterType,
  }).sort({ readingDate: -1, createdAt: -1 });

  const previousReadingValue = lastReading?.currentReadingValue ?? 0;
  if (input.currentReadingValue < previousReadingValue) {
    throw badRequest("Current reading cannot be lower than the previous reading");
  }

  const unitsConsumed = input.currentReadingValue - previousReadingValue;
  const amountMinor = Math.round(unitsConsumed * input.ratePerUnitMinor);

  const reading = await UtilityMeterReading.create({
    unit: input.unit,
    property: unit.property,
    owner: req.userId,
    meterType: input.meterType,
    readingDate: input.readingDate,
    previousReadingValue,
    currentReadingValue: input.currentReadingValue,
    unitsConsumed,
    ratePerUnitMinor: input.ratePerUnitMinor,
    amountMinor,
    billed: false,
    note: input.note,
  });

  res.status(201).json(reading);
}

/** Turns a recorded meter reading into a utility charge on the tenant's invoice for the given month. */
export async function bill(req: Request, res: Response) {
  const input = billMeterReadingSchema.parse(req.body);

  const reading = await UtilityMeterReading.findOne({ _id: req.params.id, owner: req.userId });
  if (!reading) throw notFound("Meter reading");
  if (reading.billed) throw badRequest("This reading has already been billed");

  const lease = await Lease.findOne({ _id: input.lease, owner: req.userId, unit: reading.unit });
  if (!lease) throw notFound("Lease for this unit");

  const now = new Date();
  const month = input.month ?? monthKey(now);
  const { invoice } = await getOrCreateMonthlyInvoice(lease, month, now);
  await addLineItemToInvoice(
    invoice,
    {
      type: "utility",
      description: `${reading.meterType} usage: ${reading.unitsConsumed} units`,
      amountMinor: reading.amountMinor,
    },
    now,
    lease.tenant,
  );

  reading.billed = true;
  reading.invoice = invoice._id;
  await reading.save();

  res.json(reading);
}
