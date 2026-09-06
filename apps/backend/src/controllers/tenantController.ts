import type { Request, Response } from "express";
import { Lease, Tenant, User } from "../models/index.js";
import { badRequest, notFound, unauthorized } from "../utils/httpError.js";
import {
  createTenantSchema,
  markSelfAsLesseeSchema,
  updateTenantSchema,
} from "../validators/tenant.js";

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

/**
 * Lets the logged-in owner mark themselves as a lessee — e.g. they're renting
 * a place themselves and want it tracked the same way as any other tenant.
 * Creates (or returns the existing) Tenant record linked back to their own
 * account, and tags their profile with the "lessee" role.
 */
export async function markSelfAsLessee(req: Request, res: Response) {
  const input = markSelfAsLesseeSchema.parse(req.body);

  const user = await User.findById(req.userId);
  if (!user) throw unauthorized();

  const existing = await Tenant.findOne({ owner: req.userId, linkedUser: req.userId });
  if (existing) return res.json(existing);

  const tenant = await Tenant.create({
    owner: req.userId,
    name: user.name,
    email: user.email,
    phone: input.phone,
    alternatePhone: input.alternatePhone,
    idProofType: input.idProofType,
    idProofNumber: input.idProofNumber,
    linkedUser: req.userId,
  });

  if (!user.roles.includes("lessee")) {
    user.roles.push("lessee");
    await user.save();
  }

  res.status(201).json(tenant);
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
