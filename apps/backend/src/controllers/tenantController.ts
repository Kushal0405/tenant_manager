import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import type { TenantLeaseSummary } from "@rent-manager/shared";
import { Lease, LedgerEntry, Property, Tenant, Unit, User } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { createTenantSchema, linkTenantSchema, updateTenantSchema } from "../validators/tenant.js";

export async function list(req: Request, res: Response) {
  const tenants = await Tenant.find({ owner: req.userId })
    .populate("linkedUser", "name email")
    .sort({ createdAt: -1 });
  res.json(tenants);
}

/** Build the per-lease history for a tenant, including each lease's current balance. */
async function leaseSummaries(tenantId: string, ownerId: string): Promise<TenantLeaseSummary[]> {
  const leases = await Lease.find({ tenant: tenantId, owner: ownerId }).sort({ startDate: -1 });
  const unitIds = leases.map((l) => l.unit);
  const units = await Unit.find({ _id: { $in: unitIds } });
  const properties = await Property.find({ _id: { $in: units.map((u) => u.property) } });

  const unitById = new Map(units.map((u) => [u._id.toString(), u]));
  const propById = new Map(properties.map((p) => [p._id.toString(), p]));

  return Promise.all(
    leases.map(async (lease) => {
      const unit = unitById.get(lease.unit.toString());
      const prop = unit ? propById.get(unit.property.toString()) : undefined;
      const lastEntry = await LedgerEntry.findOne({ tenant: tenantId, lease: lease._id })
        .sort({ date: -1, createdAt: -1 })
        .lean();
      return {
        leaseId: lease._id.toString(),
        unitId: unit?._id.toString() ?? "",
        unitLabel: unit?.label ?? "—",
        propertyId: prop?._id.toString() ?? "",
        propertyName: prop?.name ?? "—",
        status: lease.status,
        startDate: lease.startDate.toISOString(),
        endDate: lease.endDate.toISOString(),
        rentAmountMinor: lease.rentAmountMinor,
        rentFrequency: lease.rentFrequency,
        currentBalanceMinor: lastEntry?.runningBalanceMinor ?? 0,
        depositAmountMinor: lease.depositAmountMinor,
        depositReturnedMinor: lease.depositReturnedMinor ?? undefined,
      } satisfies TenantLeaseSummary;
    }),
  );
}

export async function get(req: Request, res: Response) {
  const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId }).populate(
    "linkedUser",
    "name email",
  );
  if (!tenant) throw notFound("Tenant");
  const leases = await leaseSummaries(tenant._id.toString(), req.userId!);
  res.json({ ...tenant.toJSON(), leases });
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
  }).populate("linkedUser", "name email");
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

/**
 * Link this tenant record to an app user account. Either pass an existing
 * user's id, or a name+email to register a new account (a random password is
 * set; the user resets it via the normal flow). The linked user can then log
 * in and see this tenant's ledger.
 */
export async function link(req: Request, res: Response) {
  const input = linkTenantSchema.parse(req.body);
  const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
  if (!tenant) throw notFound("Tenant");

  let userId = input.userId;
  if (!userId) {
    const existing = await User.findOne({ email: input.email!.toLowerCase() });
    if (existing) {
      userId = existing._id.toString();
    } else {
      const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
      const created = await User.create({ name: input.name!, email: input.email!, passwordHash });
      userId = created._id.toString();
    }
  }

  const clash = await Tenant.findOne({
    owner: req.userId,
    linkedUser: userId,
    _id: { $ne: tenant._id },
  });
  if (clash) throw badRequest("That user is already linked to another tenant");

  tenant.linkedUser = userId as never;
  await tenant.save();
  await tenant.populate("linkedUser", "name email");
  res.json(tenant);
}

export async function unlink(req: Request, res: Response) {
  const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
  if (!tenant) throw notFound("Tenant");
  tenant.linkedUser = undefined as never;
  await tenant.save();
  res.json(tenant);
}
