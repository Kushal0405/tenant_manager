import type { Request, Response } from "express";
import { Lease, Meter, UtilityMeterReading } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import {
  addLineItemToInvoice,
  getOrCreatePeriodInvoice,
  periodStartContaining,
  type RentFrequency,
} from "../services/billingService.js";
import { billMeterReadingSchema, createMeterReadingSchema } from "../validators/meterReading.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.unit) filter.unit = req.query.unit;
  if (req.query.meter) filter.meter = req.query.meter;
  if (req.query.meterType) filter.meterType = req.query.meterType;
  if (req.query.billed !== undefined) filter.billed = req.query.billed === "true";
  const readings = await UtilityMeterReading.find(filter).sort({ readingDate: -1 });
  res.json(readings);
}

export async function create(req: Request, res: Response) {
  const input = createMeterReadingSchema.parse(req.body);

  const meter = await Meter.findOne({ _id: input.meter, owner: req.userId });
  if (!meter) throw notFound("Meter");

  const lastReading = await UtilityMeterReading.findOne({ meter: meter._id }).sort({
    readingDate: -1,
    createdAt: -1,
  });

  const previousReadingValue = lastReading?.currentReadingValue ?? 0;
  if (input.currentReadingValue < previousReadingValue) {
    throw badRequest("Current reading cannot be lower than the previous reading");
  }

  const unitsConsumed = input.currentReadingValue - previousReadingValue;
  const amountMinor = Math.round(unitsConsumed * input.ratePerUnitMinor);

  const reading = await UtilityMeterReading.create({
    meter: meter._id,
    unit: meter.unit,
    property: meter.property,
    owner: req.userId,
    meterType: meter.utilityType,
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

/** Turns a recorded meter reading into a utility charge on the tenant's invoice for the given period. */
export async function bill(req: Request, res: Response) {
  const input = billMeterReadingSchema.parse(req.body);

  const reading = await UtilityMeterReading.findOne({ _id: req.params.id, owner: req.userId });
  if (!reading) throw notFound("Meter reading");
  if (reading.billed) throw badRequest("This reading has already been billed");
  if (!reading.unit) {
    throw badRequest("A main-meter reading covers the whole property and can't be billed to a single lease");
  }

  const lease = await Lease.findOne({ _id: input.lease, owner: req.userId, unit: reading.unit });
  if (!lease) throw notFound("Lease for this unit");

  const now = new Date();
  const targetDate = input.periodDate ?? now;
  const periodStart = periodStartContaining(lease.startDate, lease.rentFrequency as RentFrequency, targetDate);
  const { invoice } = await getOrCreatePeriodInvoice(lease, periodStart, now);
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
