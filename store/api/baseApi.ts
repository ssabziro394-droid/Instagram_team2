import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// @TODO(Team Lead): Please review this RootState import needed to access the auth token
import type { RootState } from "../store";

// This is a placeholder base API using MockAPI or similar backend
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl:
      // here: силкаи запрос кати тугри намегирад, барои хавай ин силкара мондм
      process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj/",
    prepareHeaders: (headers, { getState }) => {
      //here: @TODO(Team Lead): Added token injection logic here. Please review and approve.
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
});
