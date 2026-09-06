import { Invoice, Lease } from "../models/index.js";
import { computeLateFeeAmount, recomputeStatus } from "./billingService.js";
import { appendLedgerEntry } from "./ledgerService.js";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Applies the lease's configured late fee to any of its unpaid/partial
 * invoices that are past (dueDate + graceDays) and haven't had a late fee
 * applied yet. Returns how many invoices were charged.
 */
export async function applyLateFeesForActiveLeases(now = new Date()): Promise<number> {
  const activeLeases = await Lease.find({ status: "active" }).lean();
  let applied = 0;

  for (const lease of activeLeases) {
    const overdueCandidates = await Invoice.find({
      lease: lease._id,
      status: { $in: ["unpaid", "partial", "overdue"] },
      lateFeeApplied: false,
    });

    for (const invoice of overdueCandidates) {
      const feeDeadline = addDays(invoice.dueDate, lease.lateFeeRule.graceDays);
      if (now <= feeDeadline) continue;

      const feeAmount = computeLateFeeAmount(lease.lateFeeRule, invoice.totalMinor);
      if (feeAmount <= 0) {
        invoice.lateFeeApplied = true;
        await invoice.save();
        continue;
      }

      invoice.lineItems.push({
        type: "late_fee",
        description: `Late fee (grace period ended ${feeDeadline.toISOString().slice(0, 10)})`,
        amountMinor: feeAmount,
      });
      invoice.subtotalMinor += feeAmount;
      invoice.totalMinor += feeAmount;
      invoice.lateFeeApplied = true;
      invoice.status = recomputeStatus(invoice.totalMinor, invoice.amountPaidMinor, invoice.dueDate, now);
      await invoice.save();

      await appendLedgerEntry({
        tenant: lease.tenant,
        lease: lease._id,
        owner: lease.owner,
        type: "charge",
        amountMinor: feeAmount,
        description: "Late fee applied",
        date: now,
        refInvoice: invoice._id,
      });

      applied += 1;
    }
  }

  return applied;
}
