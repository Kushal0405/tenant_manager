import { Lease, Tenant, Unit, type LeaseDoc } from "../models/index.js";
import type { HydratedDocument } from "mongoose";
import { appendLedgerEntry } from "./ledgerService.js";
import { badRequest, notFound } from "../utils/httpError.js";

export interface LateFeeRuleInput {
  graceDays: number;
  feeType: "flat" | "percent";
  feeValueMinor?: number;
  feePercent?: number;
}

export interface CreateLeaseInput {
  unit: string;
  tenant: string;
  owner: string;
  startDate: Date;
  endDate: Date;
  rentAmountMinor: number;
  depositAmountMinor: number;
  dueDayOfMonth: number;
  lateFeeRule: LateFeeRuleInput;
}

export async function createLease(input: CreateLeaseInput) {
  const unit = await Unit.findOne({ _id: input.unit, owner: input.owner });
  if (!unit) throw notFound("Unit");

  const tenant = await Tenant.findOne({ _id: input.tenant, owner: input.owner });
  if (!tenant) throw notFound("Tenant");

  const activeLease = await Lease.findOne({ unit: input.unit, status: "active" });
  if (activeLease) {
    throw badRequest("This unit already has an active lease");
  }

  const lease = await Lease.create({ ...input, status: "active", amendments: [] });

  unit.status = "occupied";
  await unit.save();

  if (input.depositAmountMinor > 0) {
    await appendLedgerEntry({
      tenant: input.tenant,
      lease: lease._id,
      owner: input.owner,
      type: "deposit",
      amountMinor: input.depositAmountMinor,
      description: "Security deposit collected",
      date: input.startDate,
    });
  }

  return lease;
}

export interface LeaseTermChanges {
  rentAmountMinor?: number;
  depositAmountMinor?: number;
  dueDayOfMonth?: number;
  endDate?: Date;
  lateFeeRule?: LateFeeRuleInput;
}

/**
 * Updates a rental agreement's terms (rent revision, renewal extension,
 * due-day change, late fee rule change, ...) and appends an amendment
 * record so the lease keeps a full audit trail of what changed and why.
 */
export async function amendLease(
  leaseId: string,
  ownerId: string,
  changes: LeaseTermChanges,
  effectiveDate: Date,
  reason?: string,
) {
  const lease = await Lease.findOne({ _id: leaseId, owner: ownerId });
  if (!lease) throw notFound("Lease");
  if (lease.status !== "active") {
    throw badRequest("Only active leases can be amended");
  }
  if (Object.keys(changes).length === 0) {
    throw badRequest("No changes provided");
  }

  lease.amendments.push({ effectiveDate, changes, reason, amendedAt: new Date() });

  if (changes.rentAmountMinor !== undefined) lease.rentAmountMinor = changes.rentAmountMinor;
  if (changes.depositAmountMinor !== undefined) lease.depositAmountMinor = changes.depositAmountMinor;
  if (changes.dueDayOfMonth !== undefined) lease.dueDayOfMonth = changes.dueDayOfMonth;
  if (changes.endDate !== undefined) lease.endDate = changes.endDate;
  if (changes.lateFeeRule !== undefined) lease.lateFeeRule = changes.lateFeeRule;

  await lease.save();
  return lease;
}

export interface TerminateLeaseInput {
  terminatedAt: Date;
  depositReturnedMinor: number;
  depositDeductionNote?: string;
}

export async function terminateLease(
  leaseId: string,
  ownerId: string,
  input: TerminateLeaseInput,
) {
  const lease: HydratedDocument<LeaseDoc> | null = await Lease.findOne({
    _id: leaseId,
    owner: ownerId,
  });
  if (!lease) throw notFound("Lease");
  if (lease.status === "terminated") {
    throw badRequest("Lease is already terminated");
  }
  if (input.depositReturnedMinor > lease.depositAmountMinor) {
    throw badRequest("Deposit returned cannot exceed the deposit held");
  }

  lease.status = "terminated";
  lease.terminatedAt = input.terminatedAt;
  lease.depositReturnedMinor = input.depositReturnedMinor;
  lease.depositDeductionNote = input.depositDeductionNote;
  await lease.save();

  const deduction = lease.depositAmountMinor - input.depositReturnedMinor;
  if (deduction > 0) {
    await appendLedgerEntry({
      tenant: lease.tenant,
      lease: lease._id,
      owner: ownerId,
      type: "deposit_deduction",
      amountMinor: -deduction,
      description: input.depositDeductionNote || "Security deposit deduction at lease end",
      date: input.terminatedAt,
    });
  }

  const otherActiveLease = await Lease.findOne({ unit: lease.unit, status: "active" });
  if (!otherActiveLease) {
    await Unit.updateOne({ _id: lease.unit }, { status: "vacant" });
  }

  return lease;
}
