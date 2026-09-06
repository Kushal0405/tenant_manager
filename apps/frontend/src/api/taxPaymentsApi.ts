import type { TaxPayment, TaxType } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateTaxPaymentInput {
  property: string;
  taxType: TaxType;
  period: string;
  amountMinor: number;
  dueDate: string;
  receiptNumber?: string;
  note?: string;
}

export interface MarkTaxPaymentPaidInput {
  id: string;
  paidDate: string;
  receiptNumber?: string;
}

export const taxPaymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listTaxPayments: builder.query<TaxPayment[], { property?: string; status?: string } | void>({
      query: (params) => ({ url: "/tax-payments", params: params ?? undefined }),
      providesTags: [{ type: "TaxPayment", id: "LIST" }],
    }),
    createTaxPayment: builder.mutation<TaxPayment, CreateTaxPaymentInput>({
      query: (body) => ({ url: "/tax-payments", method: "POST", body }),
      invalidatesTags: [{ type: "TaxPayment", id: "LIST" }],
    }),
    markTaxPaymentPaid: builder.mutation<TaxPayment, MarkTaxPaymentPaidInput>({
      query: ({ id, ...body }) => ({ url: `/tax-payments/${id}/mark-paid`, method: "POST", body }),
      invalidatesTags: [{ type: "TaxPayment", id: "LIST" }],
    }),
    deleteTaxPayment: builder.mutation<void, string>({
      query: (id) => ({ url: `/tax-payments/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "TaxPayment", id: "LIST" }],
    }),
  }),
});

export const {
  useListTaxPaymentsQuery,
  useCreateTaxPaymentMutation,
  useMarkTaxPaymentPaidMutation,
  useDeleteTaxPaymentMutation,
} = taxPaymentsApi;
