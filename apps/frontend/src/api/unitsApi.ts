import type { Unit } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateUnitInput {
  property: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  baseRentMinor: number;
  floor?: number;
}

export const unitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listUnits: builder.query<Unit[], { property?: string } | void>({
      query: (params) => ({ url: "/units", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "Unit" as const, id: u.id })), { type: "Unit" as const, id: "LIST" }]
          : [{ type: "Unit" as const, id: "LIST" }],
    }),
    createUnit: builder.mutation<Unit, CreateUnitInput>({
      query: (body) => ({ url: "/units", method: "POST", body }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),
  }),
});

export const { useListUnitsQuery, useCreateUnitMutation } = unitsApi;
