import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";

const API_BASE_URL = "https://instagram-api.softclub.tj/";

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token")
  );
}

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
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Reel", "Comment"],
  endpoints: () => ({}),
});