import type { Request, Response } from "express";
import { Lease, Property, Unit } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { createUnitSchema, updateUnitSchema } from "../validators/unit.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.property) filter.property = req.query.property;
  const units = await Unit.find(filter).sort({ createdAt: -1 });
  res.json(units);
}

export async function get(req: Request, res: Response) {
  const unit = await Unit.findOne({ _id: req.params.id, owner: req.userId });
  if (!unit) throw notFound("Unit");
  res.json(unit);
}

export async function create(req: Request, res: Response) {
  const input = createUnitSchema.parse(req.body);

  const property = await Property.findOne({ _id: input.property, owner: req.userId });
  if (!property) throw notFound("Property");

  const unit = await Unit.create({ ...input, owner: req.userId });
  res.status(201).json(unit);
}

export async function update(req: Request, res: Response) {
  const input = updateUnitSchema.parse(req.body);
  const unit = await Unit.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, input, {
    new: true,
  });
  if (!unit) throw notFound("Unit");
  res.json(unit);
}

export async function remove(req: Request, res: Response) {
  const unit = await Unit.findOne({ _id: req.params.id, owner: req.userId });
  if (!unit) throw notFound("Unit");

  const leaseCount = await Lease.countDocuments({ unit: unit._id });
  if (leaseCount > 0) {
    throw badRequest("Cannot delete a unit that has lease history");
  }

  await unit.deleteOne();
  res.status(204).send();
}
