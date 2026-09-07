import type { Meter, MeterKind, MeterType } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateMeterInput {
  property: string;
  kind: MeterKind;
  utilityType: MeterType;
  unit?: string;
  parentMeter?: string;
  label: string;
  meterNumber?: string;
}

export const metersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMeters: builder.query<
      Meter[],
      { property?: string; unit?: string; kind?: MeterKind; utilityType?: MeterType } | void
    >({
      query: (params) => ({ url: "/meters", params: params ?? undefined }),
      providesTags: [{ type: "MeterReading", id: "METERS_LIST" }],
    }),
    createMeter: builder.mutation<Meter, CreateMeterInput>({
      query: (body) => ({ url: "/meters", method: "POST", body }),
      invalidatesTags: [{ type: "MeterReading", id: "METERS_LIST" }],
    }),
  }),
});

export const { useListMetersQuery, useCreateMeterMutation } = metersApi;
