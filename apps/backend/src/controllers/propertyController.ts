import type { Request, Response } from "express";
import { Property, Unit } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { createPropertySchema, updatePropertySchema } from "../validators/property.js";

export async function list(req: Request, res: Response) {
  const properties = await Property.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(properties);
}

export async function get(req: Request, res: Response) {
  const property = await Property.findOne({ _id: req.params.id, owner: req.userId });
  if (!property) throw notFound("Property");
  res.json(property);
}

export async function create(req: Request, res: Response) {
  const input = createPropertySchema.parse(req.body);
  const property = await Property.create({ ...input, owner: req.userId });
  res.status(201).json(property);
}

export async function update(req: Request, res: Response) {
  const input = updatePropertySchema.parse(req.body);
  const property = await Property.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    input,
    { new: true },
  );
  if (!property) throw notFound("Property");
  res.json(property);
}

export async function remove(req: Request, res: Response) {
  const property = await Property.findOne({ _id: req.params.id, owner: req.userId });
  if (!property) throw notFound("Property");

  const unitCount = await Unit.countDocuments({ property: property._id });
  if (unitCount > 0) {
    throw badRequest("Cannot delete a property that still has units");
  }

  await property.deleteOne();
  res.status(204).send();
}
