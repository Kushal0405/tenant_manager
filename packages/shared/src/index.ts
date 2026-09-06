/**
 * Shared types used by both apps/backend and apps/frontend.
 * Mirrors the Mongoose models in apps/backend/src/models — ids are strings
 * and dates are ISO strings here since these are the wire (JSON) shapes.
 */

// All money values are integers in the smallest currency unit (e.g. paise), never floats.
export type MoneyMinor = number;

export interface ApiError {
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

// A single account can wear more than one hat — e.g. an owner who also rents
// a place elsewhere and marks themselves as a lessee on that lease. This is a
// classification, not a separate login/permission system: every account
// still logs in and manages its own data the same way.
export type UserRole = "owner" | "lessee" | "manager";

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

// ---------------------------------------------------------------------------
// Property / Unit
// ---------------------------------------------------------------------------

export type PropertyType = "flat" | "hall" | "plot" | "shop";

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Property {
  id: string;
  owner: string;
  name: string;
  address: Address;
  type: PropertyType;
  /** Only meaningful for type "flat" — how many floors the building has. */
  numberOfFloors?: number;
  createdAt: string;
}

export type UnitStatus = "vacant" | "occupied";

export interface Unit {
  id: string;
  property: string;
  owner: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  baseRentMinor: MoneyMinor;
  status: UnitStatus;
  /** Which floor this unit is on — only used for "flat" properties. */
  floor?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  owner: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  idProofType?: string;
  idProofNumber?: string;
  /** Set when this tenant record IS the app's own logged-in user — i.e. the
   * owner is renting a place themselves and marked themselves as the lessee. */
  linkedUserId?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Lease (rental agreement) + amendments
// ---------------------------------------------------------------------------

export type LeaseStatus = "active" | "expired" | "terminated";
export type LateFeeType = "flat" | "percent";

export interface LateFeeRule {
  graceDays: number;
  feeType: LateFeeType;
  // exactly one of these is used, depending on feeType
  feeValueMinor?: MoneyMinor;
  feePercent?: number;
}

/** How often rent is charged. Periods are anchored to the lease's start date, not the calendar. */
export type RentFrequency = "monthly" | "quarterly" | "half_yearly" | "yearly";

/** Editable terms of a lease — used both for lease creation and amendments. */
export interface LeaseTerms {
  rentAmountMinor: MoneyMinor;
  depositAmountMinor: MoneyMinor;
  dueDayOfMonth: number;
  endDate: string;
  lateFeeRule: LateFeeRule;
  rentFrequency: RentFrequency;
}

export interface LeaseAmendment {
  effectiveDate: string;
  changes: Partial<LeaseTerms>;
  reason?: string;
  amendedAt: string;
}

export interface Lease {
  id: string;
  unit: string;
  tenant: string;
  owner: string;
  startDate: string;
  endDate: string;
  rentAmountMinor: MoneyMinor;
  depositAmountMinor: MoneyMinor;
  dueDayOfMonth: number;
  rentFrequency: RentFrequency;
  lateFeeRule: LateFeeRule;
  status: LeaseStatus;
  terminatedAt?: string;
  depositReturnedMinor?: MoneyMinor;
  depositDeductionNote?: string;
  amendments: LeaseAmendment[];
  /** True once the historical-rent backfill has run for this lease (rentStartDate in the past at creation). */
  backfilledThrough?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Invoice / Payment
// ---------------------------------------------------------------------------

export type InvoiceLineItemType =
  | "rent"
  | "late_fee"
  | "utility"
  | "maintenance"
  | "custom";

export interface InvoiceLineItem {
  type: InvoiceLineItemType;
  description: string;
  amountMinor: MoneyMinor;
}

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue";

export interface Invoice {
  id: string;
  lease: string;
  owner: string;
  /** Display label for the billing period — "YYYY-MM" for monthly, "YYYY-MM-slash-YYYY-MM" style ranges for longer frequencies. */
  month: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotalMinor: MoneyMinor;
  totalMinor: MoneyMinor;
  amountPaidMinor: MoneyMinor;
  status: InvoiceStatus;
  lateFeeApplied: boolean;
  /** True for invoices generated retroactively by the historical rent backfill, not through normal billing. */
  isBackfilled: boolean;
  createdAt: string;
}

export type PaymentMethod = "cash" | "bank" | "upi" | "card" | "other";

export interface Payment {
  id: string;
  invoice: string;
  lease: string;
  tenant: string;
  owner: string;
  amountMinor: MoneyMinor;
  method: PaymentMethod;
  date: string;
  recordedBy: string;
  note?: string;
  /** True for payments auto-recorded by the historical rent backfill (assumed paid), not actually collected via the app. */
  isBackfilled: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Expense / Tax payment (owner-side, not billed to tenant)
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | "repair"
  | "utility"
  | "tax"
  | "insurance"
  | "management_fee"
  | "other";

export interface Expense {
  id: string;
  property: string;
  owner: string;
  category: ExpenseCategory;
  amountMinor: MoneyMinor;
  date: string;
  note?: string;
  createdAt: string;
}

// "Tax payment" covers statutory dues paid by the owner to a government body:
// property tax, GST/TDS remittance, and other municipal/government bills
// (water board, electricity duty, gas board) that aren't billed to a tenant.
export type TaxType =
  | "property_tax"
  | "gst"
  | "tds"
  | "water_bill"
  | "electricity_bill"
  | "gas_bill"
  | "other";
export type TaxPaymentStatus = "pending" | "paid" | "overdue";

export interface TaxPayment {
  id: string;
  property: string;
  owner: string;
  taxType: TaxType;
  period: string; // e.g. "2025-2026" (financial year) or "2026-Q1"
  amountMinor: MoneyMinor;
  dueDate: string;
  paidDate?: string;
  status: TaxPaymentStatus;
  receiptNumber?: string;
  note?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Meters (main / sub) and utility meter readings
// ---------------------------------------------------------------------------

export type MeterType = "electricity" | "water" | "gas";
export type MeterKind = "main" | "sub";

export interface Meter {
  id: string;
  owner: string;
  property: string;
  /** Required for a "sub" meter (which unit it serves); absent for a "main" meter, which covers the whole property. */
  unit?: string;
  kind: MeterKind;
  utilityType: MeterType;
  /** Required for a "sub" meter — the property's main meter of the same utility type that it draws from. */
  parentMeter?: string;
  label: string;
  meterNumber?: string;
  createdAt: string;
}

export interface UtilityMeterReading {
  id: string;
  meter: string;
  unit?: string;
  property: string;
  owner: string;
  meterType: MeterType;
  readingDate: string;
  previousReadingValue: number;
  currentReadingValue: number;
  unitsConsumed: number;
  ratePerUnitMinor: MoneyMinor;
  amountMinor: MoneyMinor;
  billed: boolean;
  invoice?: string;
  note?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export type LedgerEntryType =
  | "charge"
  | "payment"
  | "credit"
  | "deposit"
  | "deposit_deduction";

export interface LedgerEntry {
  id: string;
  tenant: string;
  lease: string;
  owner: string;
  type: LedgerEntryType;
  amountMinor: MoneyMinor; // signed: charge/deposit positive, payment/credit/deposit_deduction negative
  runningBalanceMinor: MoneyMinor;
  refInvoice?: string;
  refPayment?: string;
  description: string;
  date: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dashboard / reports
// ---------------------------------------------------------------------------

export interface OverdueTenantSummary {
  tenantId: string;
  tenantName: string;
  unitLabel: string;
  propertyName: string;
  overdueAmountMinor: MoneyMinor;
  daysOverdue: number;
  invoiceId: string;
}

export interface UpcomingRenewalSummary {
  leaseId: string;
  tenantName: string;
  unitLabel: string;
  propertyName: string;
  endDate: string;
  daysUntilEnd: number;
}

export interface DashboardSummary {
  collectedThisMonthMinor: MoneyMinor;
  outstandingDuesMinor: MoneyMinor;
  occupancyPct: number;
  overdueTenants: OverdueTenantSummary[];
  upcomingRenewals: UpcomingRenewalSummary[];
}

export type ReportScopeType = "portfolio" | "property" | "unit";
export type ReportPeriodType = "monthly" | "yearly";

export interface IncomeStatementRow {
  period: string; // "YYYY-MM" or "YYYY"
  incomeMinor: MoneyMinor;
  expensesMinor: MoneyMinor;
  taxesMinor: MoneyMinor;
  netMinor: MoneyMinor;
}

export interface IncomeStatement {
  scope: ReportScopeType;
  scopeId?: string;
  periodType: ReportPeriodType;
  rows: IncomeStatementRow[];
  totals: Omit<IncomeStatementRow, "period">;
}
