import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base API using Swagger API backend
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers) => {
      // Retrieve token dynamically from localStorage if available in browser
      if (typeof window !== "undefined") {
        const token = 
          localStorage.getItem("token") || 
          localStorage.getItem("accessToken") || 
          localStorage.getItem("access_token");
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
}); 
