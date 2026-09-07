import type { DashboardSummary, IncomeStatement, ReportPeriodType, ReportScopeType } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface IncomeStatementParams {
  scope: ReportScopeType;
  scopeId?: string;
  periodType: ReportPeriodType;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => "/reports/dashboard",
      providesTags: [{ type: "Report", id: "DASHBOARD" }],
    }),
    getIncomeStatement: builder.query<IncomeStatement, IncomeStatementParams>({
      query: (params) => ({ url: "/reports/income-statement", params }),
      providesTags: [{ type: "Report", id: "INCOME_STATEMENT" }],
    }),
  }),
});

export const { useGetDashboardSummaryQuery, useGetIncomeStatementQuery } = reportsApi;

/** Downloads the CSV export directly (fetchBaseQuery isn't a great fit for file downloads). */
export async function downloadIncomeStatementCsv(token: string | null, params: IncomeStatementParams) {
  const search = new URLSearchParams({ scope: params.scope, periodType: params.periodType });
  if (params.scopeId) search.set("scopeId", params.scopeId);

  const response = await fetch(`/api/reports/income-statement/csv?${search.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to download CSV (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `income-statement-${params.scope}-${params.periodType}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
