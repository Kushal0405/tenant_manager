import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../app/store";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Property",
    "Unit",
    "Tenant",
    "Lease",
    "Invoice",
    "Payment",
    "Expense",
    "TaxPayment",
    "MeterReading",
    "Report",
  ],
  endpoints: () => ({}),
});
