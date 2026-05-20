import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ 
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
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
});
