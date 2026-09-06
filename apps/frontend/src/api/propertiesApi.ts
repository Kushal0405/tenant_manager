import type { Address, Property, PropertyType } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreatePropertyInput {
  name: string;
  address: Address;
  type: PropertyType;
  numberOfFloors?: number;
}

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProperties: builder.query<Property[], void>({
      query: () => "/properties",
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: "Property" as const, id: p.id })), { type: "Property" as const, id: "LIST" }]
          : [{ type: "Property" as const, id: "LIST" }],
    }),
    createProperty: builder.mutation<Property, CreatePropertyInput>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      invalidatesTags: [{ type: "Property", id: "LIST" }],
    }),
    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Property", id: "LIST" }],
    }),
  }),
});

export const { useListPropertiesQuery, useCreatePropertyMutation, useDeletePropertyMutation } =
  propertiesApi;
