import type { HydratedDocument } from "mongoose";
import { Invoice, Lease, type InvoiceDoc, type LeaseDoc } from "../models/index.js";
import { appendLedgerEntry } from "./ledgerService.js";

export type InvoiceLineItemType = "rent" | "late_fee" | "utility" | "maintenance" | "custom";

export interface LineItemInput {
  type: InvoiceLineItemType;
  description: string;
  amountMinor: number;
}

function sumLineItems(lineItems: LineItemInput[]): number {
  return lineItems.reduce((total, item) => total + item.amountMinor, 0);
}

function recomputeStatus(totalMinor: number, amountPaidMinor: number, dueDate: Date, now = new Date()) {
  if (amountPaidMinor >= totalMinor && totalMinor > 0) return "paid" as const;
  // Any outstanding balance past the due date is 'overdue', even if partially paid —
  // that's the more actionable signal for collections/dashboard views.
  if (now > dueDate) return "overdue" as const;
  if (amountPaidMinor > 0) return "partial" as const;
  return "unpaid" as const;
}

/** Due date for a given lease + "YYYY-MM" month, based on the lease's due-day-of-month. */
export function computeDueDate(month: string, dueDayOfMonth: number): Date {
  const [year, monthNum] = month.split("-").map(Number);
  // JS Date clamps an overflowing day (e.g. day 31 in a 30-day month) into the next month,
  // so cap at the month's actual last day.
  const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
  const day = Math.min(dueDayOfMonth, lastDayOfMonth);
  return new Date(year, monthNum - 1, day);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Idempotently ensures a lease has an invoice for the given month, creating
 * one seeded with the rent line item if it doesn't exist yet. Manual charges
 * (utilities, maintenance, late fees, one-off) are appended as extra line
 * items on this same monthly invoice rather than spawning separate invoices,
 * which is what the {lease, month} unique index assumes.
 */
export async function getOrCreateMonthlyInvoice(
  lease: HydratedDocument<LeaseDoc>,
  month: string,
  issueDate: Date,
) {
  const existing = await Invoice.findOne({ lease: lease._id, month });
  if (existing) return { invoice: existing, created: false };

  const dueDate = computeDueDate(month, lease.dueDayOfMonth);
  const lineItems: LineItemInput[] = [
    { type: "rent", description: `Rent for ${month}`, amountMinor: lease.rentAmountMinor },
  ];
  const totalMinor = sumLineItems(lineItems);

  const invoice = await Invoice.create({
    lease: lease._id,
    owner: lease.owner,
    month,
    issueDate,
    dueDate,
    lineItems,
    subtotalMinor: totalMinor,
    totalMinor,
    amountPaidMinor: 0,
    status: recomputeStatus(totalMinor, 0, dueDate, issueDate),
    lateFeeApplied: false,
  });

  await appendLedgerEntry({
    tenant: lease.tenant,
    lease: lease._id,
    owner: lease.owner,
    type: "charge",
    amountMinor: totalMinor,
    description: `Rent charge for ${month}`,
    date: issueDate,
    refInvoice: invoice._id,
  });

  return { invoice, created: true };
}

export async function addLineItemToInvoice(
  invoice: HydratedDocument<InvoiceDoc>,
  item: LineItemInput,
  chargeDate: Date,
  tenantId: unknown,
) {
  invoice.lineItems.push(item);
  invoice.subtotalMinor += item.amountMinor;
  invoice.totalMinor += item.amountMinor;
  invoice.status = recomputeStatus(
    invoice.totalMinor,
    invoice.amountPaidMinor,
    invoice.dueDate,
    chargeDate,
  );
  await invoice.save();

  await appendLedgerEntry({
    tenant: tenantId as string,
    lease: invoice.lease,
    owner: invoice.owner,
    type: "charge",
    amountMinor: item.amountMinor,
    description: item.description,
    date: chargeDate,
    refInvoice: invoice._id,
  });

  return invoice;
}

export function computeLateFeeAmount(
  rule: {
    feeType: "flat" | "percent";
    feeValueMinor?: number | null;
    feePercent?: number | null;
  },
  invoiceTotalMinor: number,
): number {
  if (rule.feeType === "flat") return rule.feeValueMinor ?? 0;
  return Math.round((invoiceTotalMinor * (rule.feePercent ?? 0)) / 100);
}

/**
 * Auto-generates the current month's rent invoice for every active lease
 * that doesn't already have one. Meant to run daily from the cron job so it
 * naturally covers leases created mid-month, without ever double-billing
 * (the {lease, month} unique index plus the findOne check make this
 * idempotent to re-run).
 */
export async function generateMonthlyInvoicesForActiveLeases(now = new Date()): Promise<number> {
  const month = monthKey(now);
  const activeLeases = await Lease.find({ status: "active" });

  let created = 0;
  for (const lease of activeLeases) {
    const result = await getOrCreateMonthlyInvoice(lease, month, now);
    if (result.created) created += 1;
  }
  return created;
}

/** Flips unpaid/partial invoices whose due date has passed to 'overdue' so status-based queries (dashboard, reports) stay accurate without waiting for the next write to that invoice. */
export async function refreshOverdueInvoiceStatuses(now = new Date()): Promise<number> {
  const result = await Invoice.updateMany(
    { status: { $in: ["unpaid", "partial"] }, dueDate: { $lt: now } },
    { status: "overdue" },
  );
  return result.modifiedCount;
}

export { recomputeStatus, sumLineItems };
