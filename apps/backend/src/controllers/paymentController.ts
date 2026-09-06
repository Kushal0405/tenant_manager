import type { Request, Response } from "express";
import { Payment } from "../models/index.js";
import * as paymentService from "../services/paymentService.js";
import { recordPaymentSchema } from "../validators/payment.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.invoice) filter.invoice = req.query.invoice;
  if (req.query.tenant) filter.tenant = req.query.tenant;
  const payments = await Payment.find(filter).sort({ date: -1 });
  res.json(payments);
}

export async function create(req: Request, res: Response) {
  const input = recordPaymentSchema.parse(req.body);
  const { payment } = await paymentService.recordPayment({
    invoiceId: input.invoice,
    ownerId: req.userId!,
    amountMinor: input.amountMinor,
    method: input.method,
    date: input.date,
    note: input.note,
    recordedBy: req.userId!,
  });
  res.status(201).json(payment);
}
