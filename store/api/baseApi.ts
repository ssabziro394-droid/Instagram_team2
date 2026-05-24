import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout } from "../slices/authSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token ?? getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
    api.dispatch(logout());
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  return result;
};

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
