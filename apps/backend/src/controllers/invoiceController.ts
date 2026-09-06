import type { Request, Response } from "express";
import { Invoice, Lease } from "../models/index.js";
import { notFound } from "../utils/httpError.js";
import {
  addLineItemToInvoice,
  generateInvoicesForActiveLeases,
  getOrCreatePeriodInvoice,
  periodStartContaining,
  refreshOverdueInvoiceStatuses,
  type RentFrequency,
} from "../services/billingService.js";
import { applyLateFeesForActiveLeases } from "../services/lateFeeService.js";
import { createChargeSchema } from "../validators/invoice.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.lease) filter.lease = req.query.lease;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.month) filter.month = req.query.month;
  const invoices = await Invoice.find(filter).sort({ issueDate: -1 });
  res.json(invoices);
}

export async function get(req: Request, res: Response) {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.userId });
  if (!invoice) throw notFound("Invoice");
  res.json(invoice);
}

/** Manual charge creation: late fees, utilities, maintenance, one-off charges. */
export async function createCharge(req: Request, res: Response) {
  const input = createChargeSchema.parse(req.body);
  const lease = await Lease.findOne({ _id: input.lease, owner: req.userId });
  if (!lease) throw notFound("Lease");

  const now = new Date();
  const targetDate = input.periodDate ?? now;
  const periodStart = periodStartContaining(lease.startDate, lease.rentFrequency as RentFrequency, targetDate);
  const { invoice } = await getOrCreatePeriodInvoice(lease, periodStart, now);
  const updated = await addLineItemToInvoice(
    invoice,
    { type: input.type, description: input.description, amountMinor: input.amountMinor },
    now,
    lease.tenant,
  );

  res.status(201).json(updated);
}

/** Manually triggers the same work the nightly cron does — handy for demos/testing. */
export async function runBillingCycleNow(_req: Request, res: Response) {
  const now = new Date();
  const invoicesCreated = await generateInvoicesForActiveLeases(now);
  const markedOverdue = await refreshOverdueInvoiceStatuses(now);
  const lateFeesApplied = await applyLateFeesForActiveLeases(now);
  res.json({ invoicesCreated, markedOverdue, lateFeesApplied });
}
