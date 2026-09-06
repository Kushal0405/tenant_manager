import type { Request, Response } from "express";
import { Meter, Property, Unit } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { createMeterSchema } from "../validators/meter.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.property) filter.property = req.query.property;
  if (req.query.unit) filter.unit = req.query.unit;
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.utilityType) filter.utilityType = req.query.utilityType;
  const meters = await Meter.find(filter).sort({ createdAt: -1 });
  res.json(meters);
}

export async function create(req: Request, res: Response) {
  const input = createMeterSchema.parse(req.body);

  const property = await Property.findOne({ _id: input.property, owner: req.userId });
  if (!property) throw notFound("Property");

  if (input.kind === "sub") {
    const unit = await Unit.findOne({ _id: input.unit, owner: req.userId, property: input.property });
    if (!unit) throw notFound("Unit");

    const parentMeter = await Meter.findOne({
      _id: input.parentMeter,
      owner: req.userId,
      property: input.property,
      kind: "main",
    });
    if (!parentMeter) throw notFound("Parent (main) meter on this property");
    if (parentMeter.utilityType !== input.utilityType) {
      throw badRequest("A sub-meter must share its parent main meter's utility type");
    }
  }

  try {
    const meter = await Meter.create({
      owner: req.userId,
      property: input.property,
      unit: input.kind === "sub" ? input.unit : undefined,
      kind: input.kind,
      utilityType: input.utilityType,
      parentMeter: input.kind === "sub" ? input.parentMeter : undefined,
      label: input.label,
      meterNumber: input.meterNumber,
    });
    res.status(201).json(meter);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      throw badRequest(`This property already has a main ${input.utilityType} meter`);
    }
    throw err;
  }
}
