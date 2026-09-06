import type { Tenant } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateTenantInput {
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  idProofType?: string;
  idProofNumber?: string;
}

export interface MarkSelfAsLesseeInput {
  phone: string;
  alternatePhone?: string;
  idProofType?: string;
  idProofNumber?: string;
}

export const tenantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listTenants: builder.query<Tenant[], void>({
      query: () => "/tenants",
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "Tenant" as const, id: t.id })), { type: "Tenant" as const, id: "LIST" }]
          : [{ type: "Tenant" as const, id: "LIST" }],
    }),
    createTenant: builder.mutation<Tenant, CreateTenantInput>({
      query: (body) => ({ url: "/tenants", method: "POST", body }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
    markSelfAsLessee: builder.mutation<Tenant, MarkSelfAsLesseeInput>({
      query: (body) => ({ url: "/tenants/self", method: "POST", body }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
  }),
});

export const { useListTenantsQuery, useCreateTenantMutation, useMarkSelfAsLesseeMutation } = tenantsApi;
