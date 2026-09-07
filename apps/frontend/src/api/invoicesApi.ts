import type { Invoice, InvoiceLineItemType } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateChargeInput {
  lease: string;
  periodDate?: string;
  type: InvoiceLineItemType;
  description: string;
  amountMinor: number;
}

export interface BillingCycleResult {
  invoicesCreated: number;
  markedOverdue: number;
  lateFeesApplied: number;
}

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listInvoices: builder.query<Invoice[], { lease?: string; status?: string; month?: string } | void>({
      query: (params) => ({ url: "/invoices", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "Invoice" as const, id: i.id })),
              { type: "Invoice" as const, id: "LIST" },
            ]
          : [{ type: "Invoice" as const, id: "LIST" }],
    }),
    createCharge: builder.mutation<Invoice, CreateChargeInput>({
      query: (body) => ({ url: "/invoices/charges", method: "POST", body }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }],
    }),
    runBillingCycle: builder.mutation<BillingCycleResult, void>({
      query: () => ({ url: "/invoices/generate", method: "POST" }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }],
    }),
  }),
});

export const { useListInvoicesQuery, useCreateChargeMutation, useRunBillingCycleMutation } =
  invoicesApi;
