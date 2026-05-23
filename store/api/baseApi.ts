import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

const baseQuery = fetchBaseQuery({ 
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj",
  prepareHeaders: (headers, { getState }) => {
    // Access token from Redux store or fallback to localStorage
    const token = (getState() as RootState).auth?.token || 
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }
  return result;
};

// Base API using Swagger API backend
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl:
      // here: силкаи запрос кати тугри намегирад, барои хавай ин силкара мондм
      API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      //here: @TODO(Team Lead): Added token injection logic here. Please review and approve.
      const token = (getState() as RootState).auth?.token ?? getStoredToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
});
