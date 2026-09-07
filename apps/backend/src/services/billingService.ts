import type { HydratedDocument } from "mongoose";
import { Invoice, Lease, type InvoiceDoc, type LeaseDoc } from "../models/index.js";
import { appendLedgerEntry } from "./ledgerService.js";

export type InvoiceLineItemType = "rent" | "late_fee" | "utility" | "maintenance" | "custom";
export type RentFrequency = "monthly" | "quarterly" | "half_yearly" | "yearly";

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

/** How many calendar months a billing period spans for a given rent frequency. */
export function periodMonths(frequency: RentFrequency): number {
  return { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[frequency];
}

/** Adds a whole number of months to a date, clamping the day to the target month's length (no rollover). */
export function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDayOfTargetMonth));
  return target;
}

function monthsElapsed(anchor: Date, date: Date): number {
  let months = (date.getFullYear() - anchor.getFullYear()) * 12 + (date.getMonth() - anchor.getMonth());
  if (date.getDate() < anchor.getDate()) months -= 1;
  return months;
}

/**
 * Billing periods are anchored to the lease's start date, not the calendar —
 * e.g. a lease starting March 10 on a quarterly frequency bills Mar 10–Jun 10,
 * Jun 10–Sep 10, and so on. Returns the start of whichever period contains `date`.
 */
export function periodStartContaining(anchor: Date, frequency: RentFrequency, date: Date): Date {
  const months = periodMonths(frequency);
  const elapsed = monthsElapsed(anchor, date);
  const periodIndex = Math.floor(elapsed / months);
  return addMonthsClamped(anchor, periodIndex * months);
}

/** Exclusive end of the billing period starting at `periodStart`. */
export function periodEndExclusive(periodStart: Date, frequency: RentFrequency): Date {
  return addMonthsClamped(periodStart, periodMonths(frequency));
}

/** Due date within a period: the lease's due-day-of-month, applied to the period's first month. */
export function computeDueDateForPeriod(periodStart: Date, dueDayOfMonth: number): Date {
  const lastDayOfMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate();
  const day = Math.min(dueDayOfMonth, lastDayOfMonth);
  return new Date(periodStart.getFullYear(), periodStart.getMonth(), day);
}

function yearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Human-readable label for a billing period — "2026-03" for monthly, a month range for longer frequencies. */
export function periodLabel(periodStart: Date, frequency: RentFrequency): string {
  if (frequency === "monthly") return yearMonth(periodStart);
  const lastMonthOfPeriod = addMonthsClamped(periodStart, periodMonths(frequency) - 1);
  return `${yearMonth(periodStart)} to ${yearMonth(lastMonthOfPeriod)}`;
}

/**
 * Idempotently ensures a lease has an invoice for the billing period starting
 * at `periodStart`, creating one seeded with the rent line item if it doesn't
 * exist yet. Manual charges (utilities, maintenance, late fees, one-off) are
 * appended as extra line items on this same invoice rather than spawning
 * separate ones, which is what the {lease, periodStart} unique index assumes.
 */
export async function getOrCreatePeriodInvoice(
  lease: HydratedDocument<LeaseDoc>,
  periodStart: Date,
  issueDate: Date,
  options: { isBackfilled?: boolean } = {},
) {
  const existing = await Invoice.findOne({ lease: lease._id, periodStart });
  if (existing) return { invoice: existing, created: false };

  const periodEnd = periodEndExclusive(periodStart, lease.rentFrequency as RentFrequency);
  const dueDate = computeDueDateForPeriod(periodStart, lease.dueDayOfMonth);
  const label = periodLabel(periodStart, lease.rentFrequency as RentFrequency);
  const lineItems: LineItemInput[] = [
    { type: "rent", description: `Rent for ${label}`, amountMinor: lease.rentAmountMinor },
  ];
  const totalMinor = sumLineItems(lineItems);

  const invoice = await Invoice.create({
    lease: lease._id,
    owner: lease.owner,
    month: label,
    periodStart,
    periodEnd,
    issueDate,
    dueDate,
    lineItems,
    subtotalMinor: totalMinor,
    totalMinor,
    amountPaidMinor: 0,
    status: recomputeStatus(totalMinor, 0, dueDate, issueDate),
    lateFeeApplied: false,
    isBackfilled: options.isBackfilled ?? false,
  });

  await appendLedgerEntry({
    tenant: lease.tenant,
    lease: lease._id,
    owner: lease.owner,
    type: "charge",
    amountMinor: totalMinor,
    description: `Rent charge for ${label}`,
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
 * Auto-generates the current billing period's rent invoice for every active
 * lease that doesn't already have one, using each lease's own rent
 * frequency. Meant to run daily from the cron job so it naturally covers
 * leases created mid-period, without ever double-billing (the
 * {lease, periodStart} unique index plus the findOne check make this
 * idempotent to re-run).
 */
export async function generateInvoicesForActiveLeases(now = new Date()): Promise<number> {
  const activeLeases = await Lease.find({ status: "active" });

  let created = 0;
  for (const lease of activeLeases) {
    const periodStart = periodStartContaining(lease.startDate, lease.rentFrequency as RentFrequency, now);
    const result = await getOrCreatePeriodInvoice(lease, periodStart, now);
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
