/**
 * Shared types used by both apps/backend and apps/frontend.
 *
 * Domain entity types (Property, Unit, Tenant, Lease, Invoice, Payment,
 * Expense, LedgerEntry, ...) will be added here once the schema proposal
 * is approved, mirroring the Mongoose models in apps/backend/src/models.
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
