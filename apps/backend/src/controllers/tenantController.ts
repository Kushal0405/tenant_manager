import type { Request, Response } from "express";
import { Lease, Tenant } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { createTenantSchema, updateTenantSchema } from "../validators/tenant.js";

export async function list(req: Request, res: Response) {
  const tenants = await Tenant.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(tenants);
}

export async function get(req: Request, res: Response) {
  const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
  if (!tenant) throw notFound("Tenant");
  res.json(tenant);
}

export async function create(req: Request, res: Response) {
  const input = createTenantSchema.parse(req.body);
  const tenant = await Tenant.create({ ...input, owner: req.userId });
  res.status(201).json(tenant);
}

export async function update(req: Request, res: Response) {
  const input = updateTenantSchema.parse(req.body);
  const tenant = await Tenant.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, input, {
    new: true,
  });
  if (!tenant) throw notFound("Tenant");
  res.json(tenant);
}

export async function remove(req: Request, res: Response) {
  const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
  if (!tenant) throw notFound("Tenant");

  const leaseCount = await Lease.countDocuments({ tenant: tenant._id });
  if (leaseCount > 0) {
    throw badRequest("Cannot delete a tenant that has lease history");
  }

  await tenant.deleteOne();
  res.status(204).send();
}
