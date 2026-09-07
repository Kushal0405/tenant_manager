import type { Expense, ExpenseCategory } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export interface CreateExpenseInput {
  property: string;
  category: ExpenseCategory;
  amountMinor: number;
  date: string;
  note?: string;
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query<Expense[], { property?: string } | void>({
      query: (params) => ({ url: "/expenses", params: params ?? undefined }),
      providesTags: [{ type: "Expense", id: "LIST" }],
    }),
    createExpense: builder.mutation<Expense, CreateExpenseInput>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
  }),
});

export const { useListExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation } =
  expensesApi;
