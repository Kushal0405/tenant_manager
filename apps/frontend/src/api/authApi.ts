import type { AuthResponse, UserPublic, UserSearchResult } from "@rent-manager/shared";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: builder.mutation<AuthResponse, { name: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    me: builder.query<UserPublic, void>({
      query: () => "/auth/me",
    }),
    searchUsers: builder.query<UserSearchResult[], string>({
      query: (q) => ({ url: "/auth/users", params: { q } }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery, useLazySearchUsersQuery } = authApi;
