import type {
  Invoice,
  LateFeeRule,
  Lease,
  LedgerEntry,
  LeaseTerms,
  RentFrequency,
} from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateLeaseInput {
  unit: string;
  tenant: string;
  startDate: string;
  endDate: string;
  rentAmountMinor: number;
  depositAmountMinor: number;
  dueDayOfMonth: number;
  rentFrequency: RentFrequency;
  lateFeeRule: LateFeeRule;
}

export interface AmendLeaseInput {
  leaseId: string;
  effectiveDate: string;
  reason?: string;
  changes: Partial<LeaseTerms>;
}

export interface TerminateLeaseInput {
  leaseId: string;
  terminatedAt: string;
  depositReturnedMinor: number;
  depositDeductionNote?: string;
}

export const leasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLeases: builder.query<Lease[], { unit?: string; tenant?: string; status?: string } | void>({
      query: (params) => ({ url: "/leases", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.map((l) => ({ type: "Lease" as const, id: l.id })), { type: "Lease" as const, id: "LIST" }]
          : [{ type: "Lease" as const, id: "LIST" }],
    }),
    getLease: builder.query<Lease, string>({
      query: (id) => `/leases/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Lease", id }],
    }),
    getLeaseLedger: builder.query<LedgerEntry[], string>({
      query: (id) => `/leases/${id}/ledger`,
      providesTags: (_result, _error, id) => [{ type: "Lease", id: `ledger-${id}` }],
    }),
    getLeaseInvoices: builder.query<Invoice[], string>({
      query: (id) => `/leases/${id}/invoices`,
      providesTags: (_result, _error, id) => [{ type: "Invoice", id: `lease-${id}` }],
    }),
    createLease: builder.mutation<Lease, CreateLeaseInput>({
      query: (body) => ({ url: "/leases", method: "POST", body }),
      invalidatesTags: [
        { type: "Lease", id: "LIST" },
        { type: "Unit", id: "LIST" },
      ],
    }),
    amendLease: builder.mutation<Lease, AmendLeaseInput>({
      query: ({ leaseId, ...body }) => ({ url: `/leases/${leaseId}/amend`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Lease", id: arg.leaseId },
        { type: "Lease", id: "LIST" },
      ],
    }),
    terminateLease: builder.mutation<Lease, TerminateLeaseInput>({
      query: ({ leaseId, ...body }) => ({
        url: `/leases/${leaseId}/terminate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Lease", id: arg.leaseId },
        { type: "Lease", id: "LIST" },
        { type: "Lease", id: `ledger-${arg.leaseId}` },
        { type: "Unit", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListLeasesQuery,
  useGetLeaseQuery,
  useGetLeaseLedgerQuery,
  useGetLeaseInvoicesQuery,
  useCreateLeaseMutation,
  useAmendLeaseMutation,
  useTerminateLeaseMutation,
} = leasesApi;
