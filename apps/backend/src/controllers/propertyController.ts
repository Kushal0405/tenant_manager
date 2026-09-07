import type { HydratedDocument } from "mongoose";
import type { Request, Response } from "express";
import { Property, Tenant, Unit, User, type PropertyDoc } from "../models/index.js";
import { badRequest, notFound, unauthorized } from "../utils/httpError.js";
import { createLease, type CreateLeaseInput } from "../services/leaseService.js";
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

interface SelfLeaseInput {
  tenantPhone: string;
  rentAmountMinor: number;
  depositAmountMinor: number;
  startDate: Date;
  endDate: Date;
  dueDayOfMonth: number;
  rentFrequency: CreateLeaseInput["rentFrequency"];
}

/**
 * When a property is added with myRole "lessee", auto-creates the single
 * unit representing the rented place, a tenant record linked back to this
 * same account (they're renting it themselves), and a lease with the given
 * rent terms — reusing the normal lease-creation flow, historical backfill
 * included, so a rent start date from years ago fills in paid history.
 */
async function createSelfLease(
  property: HydratedDocument<PropertyDoc>,
  ownerId: string,
  input: SelfLeaseInput,
) {
  const unit = await Unit.create({
    owner: ownerId,
    property: property._id,
    label: property.name,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    baseRentMinor: input.rentAmountMinor,
    status: "occupied",
  });

  let tenant = await Tenant.findOne({ owner: ownerId, linkedUser: ownerId });
  if (!tenant) {
    const user = await User.findById(ownerId);
    if (!user) throw unauthorized();
    tenant = await Tenant.create({
      owner: ownerId,
      name: user.name,
      email: user.email,
      phone: input.tenantPhone,
      linkedUser: ownerId,
    });
  }

  return createLease({
    unit: unit._id.toString(),
    tenant: tenant._id.toString(),
    owner: ownerId,
    startDate: input.startDate,
    endDate: input.endDate,
    rentAmountMinor: input.rentAmountMinor,
    depositAmountMinor: input.depositAmountMinor,
    dueDayOfMonth: input.dueDayOfMonth,
    rentFrequency: input.rentFrequency,
    lateFeeRule: { graceDays: 0, feeType: "flat", feeValueMinor: 0 },
  });
}

export async function create(req: Request, res: Response) {
  const input = createPropertySchema.parse(req.body);

  const property = await Property.create({
    owner: req.userId,
    name: input.name,
    address: input.address,
    type: input.type,
    myRole: input.myRole,
    numberOfFloors: input.myRole === "owner" ? input.numberOfFloors : undefined,
    landlordName: input.landlord?.name,
    landlordPhone: input.landlord?.phone,
    landlordEmail: input.landlord?.email,
  });

  const lease =
    input.myRole === "lessee" && input.selfLease
      ? await createSelfLease(property, req.userId!, input.selfLease)
      : null;

  res.status(201).json({ property, lease });
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
