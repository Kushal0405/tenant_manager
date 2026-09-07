import type { Tenant, TenantWithLeases } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateTenantInput {
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  idProofType?: string;
  idProofNumber?: string;
}

export type UpdateTenantInput = Partial<CreateTenantInput>;

/** Link an existing account by id, or create+link a new one by name+email. */
export interface LinkTenantInput {
  userId?: string;
  name?: string;
  email?: string;
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
    getTenant: builder.query<TenantWithLeases, string>({
      query: (id) => `/tenants/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Tenant", id }],
    }),
    createTenant: builder.mutation<Tenant, CreateTenantInput>({
      query: (body) => ({ url: "/tenants", method: "POST", body }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
    updateTenant: builder.mutation<Tenant, { id: string; body: UpdateTenantInput }>({
      query: ({ id, body }) => ({ url: `/tenants/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Tenant", id: arg.id },
        { type: "Tenant", id: "LIST" },
      ],
    }),
    deleteTenant: builder.mutation<void, string>({
      query: (id) => ({ url: `/tenants/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Tenant", id: "LIST" }],
    }),
    linkTenantUser: builder.mutation<Tenant, { id: string; body: LinkTenantInput }>({
      query: ({ id, body }) => ({ url: `/tenants/${id}/link`, method: "POST", body }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "Tenant", id: arg.id },
        { type: "Tenant", id: "LIST" },
      ],
    }),
    unlinkTenantUser: builder.mutation<Tenant, string>({
      query: (id) => ({ url: `/tenants/${id}/link`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Tenant", id },
        { type: "Tenant", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListTenantsQuery,
  useGetTenantQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  useLinkTenantUserMutation,
  useUnlinkTenantUserMutation,
} = tenantsApi;
