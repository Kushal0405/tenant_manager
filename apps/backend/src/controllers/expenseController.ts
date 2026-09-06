import type { Request, Response } from "express";
import { Expense, Property } from "../models/index.js";
import { notFound } from "../utils/httpError.js";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.js";

export async function list(req: Request, res: Response) {
  const filter: Record<string, unknown> = { owner: req.userId };
  if (req.query.property) filter.property = req.query.property;
  const expenses = await Expense.find(filter).sort({ date: -1 });
  res.json(expenses);
}

export async function create(req: Request, res: Response) {
  const input = createExpenseSchema.parse(req.body);
  const property = await Property.findOne({ _id: input.property, owner: req.userId });
  if (!property) throw notFound("Property");

  const expense = await Expense.create({ ...input, owner: req.userId });
  res.status(201).json(expense);
}

export async function update(req: Request, res: Response) {
  const input = updateExpenseSchema.parse(req.body);
  const expense = await Expense.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, input, {
    new: true,
  });
  if (!expense) throw notFound("Expense");
  res.json(expense);
}

export async function remove(req: Request, res: Response) {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!expense) throw notFound("Expense");
  res.status(204).send();
}
