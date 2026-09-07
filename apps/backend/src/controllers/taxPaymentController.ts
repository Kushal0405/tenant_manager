import type { Request, Response } from "express";
import { Property, TaxPayment } from "../models/index.js";
import { notFound } from "../utils/httpError.js";
import {
  createTaxPaymentSchema,
  markTaxPaymentPaidSchema,
  updateTaxPaymentSchema,
} from "../validators/taxPayment.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.property) filter.property = req.query.property;
  if (req.query.status) filter.status = req.query.status;
  const taxPayments = await TaxPayment.find(filter).sort({ dueDate: -1 });
  res.json(taxPayments);
}

export async function create(req: Request, res: Response) {
  const input = createTaxPaymentSchema.parse(req.body);
  const property = await Property.findOne({ _id: input.property, owner: req.userId });
  if (!property) throw notFound("Property");

  const taxPayment = await TaxPayment.create({ ...input, owner: req.userId, status: "pending" });
  res.status(201).json(taxPayment);
}

export async function update(req: Request, res: Response) {
  const input = updateTaxPaymentSchema.parse(req.body);
  const taxPayment = await TaxPayment.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    input,
    { new: true },
  );
  if (!taxPayment) throw notFound("Tax payment");
  res.json(taxPayment);
}

export async function markPaid(req: Request, res: Response) {
  const input = markTaxPaymentPaidSchema.parse(req.body);
  const taxPayment = await TaxPayment.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { status: "paid", paidDate: input.paidDate, receiptNumber: input.receiptNumber },
    { new: true },
  );
  if (!taxPayment) throw notFound("Tax payment");
  res.json(taxPayment);
}

export async function remove(req: Request, res: Response) {
  const taxPayment = await TaxPayment.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!taxPayment) throw notFound("Tax payment");
  res.status(204).send();
}
