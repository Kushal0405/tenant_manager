import type {
  Address,
  LandlordContact,
  Lease,
  Property,
  PropertyRole,
  PropertyType,
  SelfLeaseInput,
} from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreatePropertyInput {
  name: string;
  address: Address;
  type: PropertyType;
  myRole: PropertyRole;
  numberOfFloors?: number;
  landlord?: LandlordContact;
  selfLease?: SelfLeaseInput;
}

export interface CreatePropertyResult {
  property: Property;
  lease: Lease | null;
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
    createProperty: builder.mutation<CreatePropertyResult, CreatePropertyInput>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      invalidatesTags: [
        { type: "Property", id: "LIST" },
        { type: "Unit", id: "LIST" },
        { type: "Tenant", id: "LIST" },
        { type: "Lease", id: "LIST" },
      ],
    }),
    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Property", id: "LIST" }],
    }),
  }),
});

export const { useListPropertiesQuery, useCreatePropertyMutation, useDeletePropertyMutation } =
  propertiesApi;
