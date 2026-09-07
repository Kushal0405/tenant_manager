import type { Request, Response } from "express";
import * as reportService from "../services/reportService.js";
import { incomeStatementQuerySchema } from "../validators/report.js";

export async function dashboard(req: Request, res: Response) {
  const summary = await reportService.getDashboardSummary(req.userId!);
  res.json(summary);
}

export async function incomeStatement(req: Request, res: Response) {
  const query = incomeStatementQuerySchema.parse(req.query);
  const statement = await reportService.getIncomeStatement(
    req.userId!,
    query.scope,
    query.periodType,
    query.scopeId,
  );
  res.json(statement);
}

export async function incomeStatementCsv(req: Request, res: Response) {
  const query = incomeStatementQuerySchema.parse(req.query);
  const statement = await reportService.getIncomeStatement(
    req.userId!,
    query.scope,
    query.periodType,
    query.scopeId,
  );
  const csv = reportService.incomeStatementToCsv(statement);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="income-statement-${query.scope}-${query.periodType}.csv"`,
  );
  res.send(csv);
}
