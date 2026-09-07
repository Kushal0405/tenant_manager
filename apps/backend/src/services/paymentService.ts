import { Invoice, Lease, Payment } from "../models/index.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { recomputeStatus } from "./billingService.js";
import { appendLedgerEntry } from "./ledgerService.js";

export interface RecordPaymentInput {
  invoiceId: string;
  ownerId: string;
  amountMinor: number;
  method: "cash" | "bank" | "upi" | "card" | "other";
  date: Date;
  recordedBy: string;
  note?: string;
  /** True for a payment auto-recorded by the historical rent backfill (assumed paid), not actually collected via the app. */
  isBackfilled?: boolean;
}

/** Records a payment against an invoice. Partial payments are supported. */
export async function recordPayment(input: RecordPaymentInput) {
  const invoice = await Invoice.findOne({ _id: input.invoiceId, owner: input.ownerId });
  if (!invoice) throw notFound("Invoice");
  if (invoice.status === "paid") {
    throw badRequest("Invoice is already fully paid");
  }
  if (input.amountMinor <= 0) {
    throw badRequest("Payment amount must be greater than zero");
  }

  const lease = await Lease.findById(invoice.lease);
  if (!lease) throw notFound("Lease");

  const payment = await Payment.create({
    invoice: invoice._id,
    lease: invoice.lease,
    tenant: lease.tenant,
    owner: input.ownerId,
    amountMinor: input.amountMinor,
    method: input.method,
    date: input.date,
    recordedBy: input.recordedBy,
    note: input.note,
    isBackfilled: input.isBackfilled ?? false,
  });

  invoice.amountPaidMinor += input.amountMinor;
  invoice.status = recomputeStatus(
    invoice.totalMinor,
    invoice.amountPaidMinor,
    invoice.dueDate,
    input.date,
  );
  await invoice.save();

  await appendLedgerEntry({
    tenant: lease.tenant,
    lease: invoice.lease,
    owner: input.ownerId,
    type: "payment",
    amountMinor: -input.amountMinor,
    description: `Payment received (${input.method})`,
    date: input.date,
    refInvoice: invoice._id,
    refPayment: payment._id,
  });

  return { invoice, payment };
}
