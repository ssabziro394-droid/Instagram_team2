import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// This is a placeholder base API using MockAPI or similar backend
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL ,
    prepareHeaders: (headers) => {
      // Logic to add JWT token if exists
      // const token = localStorage.getItem('token');
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
}); 
