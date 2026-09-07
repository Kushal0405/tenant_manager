import { Expense, Invoice, Lease, Payment, TaxPayment, Unit } from "../models/index.js";
import { badRequest } from "../utils/httpError.js";

export interface DashboardSummary {
  collectedThisMonthMinor: number;
  outstandingDuesMinor: number;
  occupancyPct: number;
  overdueTenants: Array<{
    tenantId: string;
    tenantName: string;
    unitLabel: string;
    propertyName: string;
    overdueAmountMinor: number;
    daysOverdue: number;
    invoiceId: string;
  }>;
  upcomingRenewals: Array<{
    leaseId: string;
    tenantName: string;
    unitLabel: string;
    propertyName: string;
    endDate: string;
    daysUntilEnd: number;
  }>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function getDashboardSummary(ownerId: string, now = new Date()): Promise<DashboardSummary> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [collectedAgg, outstandingInvoices, units, overdueInvoices, upcomingLeases] =
    await Promise.all([
      Payment.aggregate([
        { $match: { owner: ownerId, date: { $gte: monthStart, $lt: nextMonthStart } } },
        { $group: { _id: null, total: { $sum: "$amountMinor" } } },
      ]),
      Invoice.find({ owner: ownerId, status: { $in: ["unpaid", "partial", "overdue"] } }),
      Unit.find({ owner: ownerId }),
      Invoice.find({ owner: ownerId, status: "overdue" })
        .populate({
          path: "lease",
          populate: [
            { path: "tenant" },
            { path: "unit", populate: { path: "property" } },
          ],
        }),
      Lease.find({
        owner: ownerId,
        status: "active",
        endDate: { $gte: now, $lte: new Date(now.getTime() + 60 * MS_PER_DAY) },
      }).populate(["tenant", { path: "unit", populate: "property" }]),
    ]);

  const collectedThisMonthMinor = collectedAgg[0]?.total ?? 0;
  const outstandingDuesMinor = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.totalMinor - inv.amountPaidMinor),
    0,
  );
  const occupiedCount = units.filter((u) => u.status === "occupied").length;
  const occupancyPct = units.length === 0 ? 0 : Math.round((occupiedCount / units.length) * 1000) / 10;

  const overdueTenants = overdueInvoices
    .filter((inv) => inv.lease && (inv.lease as any).tenant && (inv.lease as any).unit)
    .map((inv) => {
      const lease = inv.lease as any;
      return {
        tenantId: lease.tenant._id.toString(),
        tenantName: lease.tenant.name,
        unitLabel: lease.unit.label,
        propertyName: lease.unit.property?.name ?? "",
        overdueAmountMinor: inv.totalMinor - inv.amountPaidMinor,
        daysOverdue: Math.floor((now.getTime() - inv.dueDate.getTime()) / MS_PER_DAY),
        invoiceId: inv._id.toString(),
      };
    });

  const upcomingRenewals = upcomingLeases.map((lease: any) => ({
    leaseId: lease._id.toString(),
    tenantName: lease.tenant.name,
    unitLabel: lease.unit.label,
    propertyName: lease.unit.property?.name ?? "",
    endDate: lease.endDate.toISOString(),
    daysUntilEnd: Math.ceil((lease.endDate.getTime() - now.getTime()) / MS_PER_DAY),
  }));

  return {
    collectedThisMonthMinor,
    outstandingDuesMinor,
    occupancyPct,
    overdueTenants,
    upcomingRenewals,
  };
}

// ---------------------------------------------------------------------------
// Income statement
// ---------------------------------------------------------------------------

export type ReportScope = "portfolio" | "property" | "unit";
export type ReportPeriodType = "monthly" | "yearly";

export interface IncomeStatementRow {
  period: string;
  incomeMinor: number;
  expensesMinor: number;
  taxesMinor: number;
  netMinor: number;
}

export interface IncomeStatement {
  scope: ReportScope;
  scopeId?: string;
  periodType: ReportPeriodType;
  rows: IncomeStatementRow[];
  totals: Omit<IncomeStatementRow, "period">;
}

function periodKey(date: Date, periodType: ReportPeriodType): string {
  return periodType === "monthly"
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    : `${date.getFullYear()}`;
}

async function resolveScope(ownerId: string, scope: ReportScope, scopeId?: string) {
  if (scope === "portfolio") {
    const leases = await Lease.find({ owner: ownerId }).select("_id");
    return { leaseIds: leases.map((l) => l._id), propertyFilter: { owner: ownerId } as Record<string, unknown> };
  }

  if (scope === "property") {
    if (!scopeId) throw badRequest("scopeId is required for property reports");
    const units = await Unit.find({ owner: ownerId, property: scopeId }).select("_id");
    const leases = await Lease.find({ owner: ownerId, unit: { $in: units.map((u) => u._id) } }).select(
      "_id",
    );
    return {
      leaseIds: leases.map((l) => l._id),
      propertyFilter: { owner: ownerId, property: scopeId } as Record<string, unknown>,
    };
  }

  if (!scopeId) throw badRequest("scopeId is required for unit reports");
  const leases = await Lease.find({ owner: ownerId, unit: scopeId }).select("_id");
  // Expenses/taxes are only tracked at the property level, so they can't be
  // attributed to a single unit — a unit-scoped statement is income-only.
  return { leaseIds: leases.map((l) => l._id), propertyFilter: null as Record<string, unknown> | null };
}

export async function getIncomeStatement(
  ownerId: string,
  scope: ReportScope,
  periodType: ReportPeriodType,
  scopeId?: string,
): Promise<IncomeStatement> {
  const { leaseIds, propertyFilter } = await resolveScope(ownerId, scope, scopeId);

  const [payments, expenses, taxPayments] = await Promise.all([
    Payment.find({ owner: ownerId, lease: { $in: leaseIds } }),
    propertyFilter ? Expense.find(propertyFilter) : Promise.resolve([]),
    propertyFilter
      ? TaxPayment.find({ ...propertyFilter, status: "paid", paidDate: { $ne: null } })
      : Promise.resolve([]),
  ]);

  const rows = new Map<string, IncomeStatementRow>();
  const bump = (
    date: Date,
    field: "incomeMinor" | "expensesMinor" | "taxesMinor",
    amountMinor: number,
  ) => {
    const key = periodKey(date, periodType);
    const row = rows.get(key) ?? { period: key, incomeMinor: 0, expensesMinor: 0, taxesMinor: 0, netMinor: 0 };
    row[field] += amountMinor;
    rows.set(key, row);
  };

  for (const payment of payments) bump(payment.date, "incomeMinor", payment.amountMinor);
  for (const expense of expenses) bump(expense.date, "expensesMinor", expense.amountMinor);
  for (const tax of taxPayments) {
    if (tax.paidDate) bump(tax.paidDate, "taxesMinor", tax.amountMinor);
  }

  const sortedRows = [...rows.values()]
    .map((row) => ({ ...row, netMinor: row.incomeMinor - row.expensesMinor - row.taxesMinor }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const totals = sortedRows.reduce(
    (acc, row) => ({
      incomeMinor: acc.incomeMinor + row.incomeMinor,
      expensesMinor: acc.expensesMinor + row.expensesMinor,
      taxesMinor: acc.taxesMinor + row.taxesMinor,
      netMinor: acc.netMinor + row.netMinor,
    }),
    { incomeMinor: 0, expensesMinor: 0, taxesMinor: 0, netMinor: 0 },
  );

  return { scope, scopeId, periodType, rows: sortedRows, totals };
}

export function incomeStatementToCsv(statement: IncomeStatement): string {
  const toMajor = (minor: number) => (minor / 100).toFixed(2);
  const header = "Period,Income,Expenses,Taxes,Net";
  const lines = statement.rows.map(
    (row) => `${row.period},${toMajor(row.incomeMinor)},${toMajor(row.expensesMinor)},${toMajor(row.taxesMinor)},${toMajor(row.netMinor)}`,
  );
  const totalsLine = `Total,${toMajor(statement.totals.incomeMinor)},${toMajor(statement.totals.expensesMinor)},${toMajor(statement.totals.taxesMinor)},${toMajor(statement.totals.netMinor)}`;
  return [header, ...lines, totalsLine].join("\n");
}
