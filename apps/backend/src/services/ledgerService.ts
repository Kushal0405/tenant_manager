import type { Types } from "mongoose";
import { LedgerEntry } from "../models/index.js";

export type LedgerEntryType = "charge" | "payment" | "credit" | "deposit" | "deposit_deduction";

export interface AppendLedgerEntryInput {
  tenant: Types.ObjectId | string;
  lease: Types.ObjectId | string;
  owner: Types.ObjectId | string;
  type: LedgerEntryType;
  amountMinor: number;
  description: string;
  date: Date;
  refInvoice?: Types.ObjectId | string;
  refPayment?: Types.ObjectId | string;
}

/**
 * Deposit and deposit-deduction entries are tracked in the same per-tenant
 * timeline as rent charges/payments/credits (so the UI can show one unified
 * history), but they never move the rent-owed running balance — the deposit
 * is a separate pot of money, not rent due. So they simply carry the
 * previous running balance forward unchanged.
 */
export function computeRunningBalance(
  previousBalance: number,
  type: LedgerEntryType,
  amountMinor: number,
): number {
  const affectsBalance = type !== "deposit" && type !== "deposit_deduction";
  return previousBalance + (affectsBalance ? amountMinor : 0);
}

export async function appendLedgerEntry(input: AppendLedgerEntryInput) {
  const latest = await LedgerEntry.findOne({ tenant: input.tenant })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const previousBalance = latest?.runningBalanceMinor ?? 0;
  const runningBalanceMinor = computeRunningBalance(previousBalance, input.type, input.amountMinor);

  return LedgerEntry.create({ ...input, runningBalanceMinor });
}

export async function getTenantLedger(tenantId: string, ownerId: string) {
  return LedgerEntry.find({ tenant: tenantId, owner: ownerId }).sort({ date: 1, createdAt: 1 });
}

export async function getTenantBalance(tenantId: string): Promise<number> {
  const latest = await LedgerEntry.findOne({ tenant: tenantId })
    .sort({ date: -1, createdAt: -1 })
    .lean();
  return latest?.runningBalanceMinor ?? 0;
}
