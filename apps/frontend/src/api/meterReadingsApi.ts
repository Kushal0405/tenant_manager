import type { MeterType, UtilityMeterReading } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateMeterReadingInput {
  unit: string;
  meterType: MeterType;
  readingDate: string;
  currentReadingValue: number;
  ratePerUnitMinor: number;
  note?: string;
}

export interface BillMeterReadingInput {
  id: string;
  lease: string;
  month?: string;
}

export const meterReadingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMeterReadings: builder.query<
      UtilityMeterReading[],
      { unit?: string; meterType?: MeterType; billed?: boolean } | void
    >({
      query: (params) => ({ url: "/meter-readings", params: params ?? undefined }),
      providesTags: [{ type: "MeterReading", id: "LIST" }],
    }),
    createMeterReading: builder.mutation<UtilityMeterReading, CreateMeterReadingInput>({
      query: (body) => ({ url: "/meter-readings", method: "POST", body }),
      invalidatesTags: [{ type: "MeterReading", id: "LIST" }],
    }),
    billMeterReading: builder.mutation<UtilityMeterReading, BillMeterReadingInput>({
      query: ({ id, ...body }) => ({ url: `/meter-readings/${id}/bill`, method: "POST", body }),
      invalidatesTags: [
        { type: "MeterReading", id: "LIST" },
        { type: "Invoice", id: "LIST" },
      ],
    }),
  }),
});

export const { useListMeterReadingsQuery, useCreateMeterReadingMutation, useBillMeterReadingMutation } =
  meterReadingsApi;
