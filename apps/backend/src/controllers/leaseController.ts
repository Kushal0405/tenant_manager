import type { Request, Response } from "express";
import { Invoice, Lease } from "../models/index.js";
import { notFound } from "../utils/httpError.js";
import { amendLeaseSchema, createLeaseSchema, terminateLeaseSchema } from "../validators/lease.js";
import * as leaseService from "../services/leaseService.js";
import { getTenantLedger } from "../services/ledgerService.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.unit) filter.unit = req.query.unit;
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.status) filter.status = req.query.status;
  const leases = await Lease.find(filter).sort({ createdAt: -1 });
  res.json(leases);
}

export async function get(req: Request, res: Response) {
  const lease = await Lease.findOne({ _id: req.params.id, owner: req.userId });
  if (!lease) throw notFound("Lease");
  res.json(lease);
}

export async function create(req: Request, res: Response) {
  const input = createLeaseSchema.parse(req.body);
  const lease = await leaseService.createLease({ ...input, owner: req.userId! });
  res.status(201).json(lease);
}

export async function amend(req: Request, res: Response) {
  const input = amendLeaseSchema.parse(req.body);
  const lease = await leaseService.amendLease(
    req.params.id,
    req.userId!,
    input.changes,
    input.effectiveDate,
    input.reason,
  );
  res.json(lease);
}

export async function terminate(req: Request, res: Response) {
  const input = terminateLeaseSchema.parse(req.body);
  const lease = await leaseService.terminateLease(req.params.id, req.userId!, input);
  res.json(lease);
}

export async function ledger(req: Request, res: Response) {
  const lease = await Lease.findOne({ _id: req.params.id, owner: req.userId });
  if (!lease) throw notFound("Lease");
  const entries = await getTenantLedger(lease.tenant.toString(), req.userId!);
  res.json(entries);
}

export async function invoices(req: Request, res: Response) {
  const lease = await Lease.findOne({ _id: req.params.id, owner: req.userId });
  if (!lease) throw notFound("Lease");
  const invoiceList = await Invoice.find({ lease: lease._id }).sort({ issueDate: -1 });
  res.json(invoiceList);
}
