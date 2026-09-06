import type { Payment, PaymentMethod } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface RecordPaymentInput {
  invoice: string;
  amountMinor: number;
  method: PaymentMethod;
  date: string;
  note?: string;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<Payment[], { invoice?: string; tenant?: string } | void>({
      query: (params) => ({ url: "/payments", params: params ?? undefined }),
      providesTags: [{ type: "Payment", id: "LIST" }],
    }),
    recordPayment: builder.mutation<Payment, RecordPaymentInput>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      invalidatesTags: (result) => [
        { type: "Payment", id: "LIST" },
        { type: "Invoice", id: "LIST" },
        ...(result ? [{ type: "Lease" as const, id: `ledger-${result.lease}` }] : []),
      ],
    }),
  }),
});

export const { useListPaymentsQuery, useRecordPaymentMutation } = paymentsApi;
