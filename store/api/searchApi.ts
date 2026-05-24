import { baseApi } from "./baseApi";
import type { ApiMessageResponse } from "@/types/profile";
import type {
  AddSearchHistoryRequest,
  AddUserSearchHistoryRequest,
  DeleteSearchHistoryRequest,
  SearchHistory,
  SearchUser,
  SearchUsersQuery,
  HistoryItem,
} from "@/types/search";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapResponse<T>(response: unknown): T {
  if (isRecord(response)) {
    for (const key of ["data", "result", "value", "payload"]) {
      const value = response[key];
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }
  }

  return response as T;
}

function unwrapList<T>(response: unknown): T[] {
  const value = unwrapResponse<unknown>(response);

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (isRecord(value)) {
    for (const key of ["items", "users", "histories", "data", "result"]) {
      const list = value[key];
      if (Array.isArray(list)) {
        return list as T[];
      }
    }
  }

  return [];
}

function compactParams(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== ""
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function searchParams(query?: SearchUsersQuery | string | void) {
  const normalized =
    typeof query === "string" ? { search: query } : query ?? {};

  return compactParams({
    UserName: normalized.search?.trim(),
    PageNumber: normalized.pageNumber,
    PageSize: normalized.pageSize,
  });
}

const SEARCH_HISTORY_BASE_URL =
  process.env.NEXT_PUBLIC_SEARCH_HISTORY_API_URL || "http://localhost:5000/search/history";

export const searchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSearchUsers: builder.query<
      { data: SearchUser[]; totalPage: number; totalRecord: number; pageNumber: number; pageSize: number } | SearchUser[],
      SearchUsersQuery | string | void
    >({
      query: (query) => ({
        url: "User/get-users",
        params: searchParams(query),
      }),
      transformResponse: (response: unknown) => {
        // If response has pagination metadata, preserve it
        if (isRecord(response) && Array.isArray((response as any).data)) {
          const r = response as any;
          return {
            data: r.data as SearchUser[],
            totalPage: r.totalPage ?? 1,
            totalRecord: r.totalRecord ?? 0,
            pageNumber: r.pageNumber ?? 1,
            pageSize: r.pageSize ?? 10,
          };
        }
        // Fallback: plain array
        return unwrapList<SearchUser>(response);
      },
      providesTags: [{ type: "User", id: "SEARCH_USERS" }],
    }),
    addSearchHistory: builder.mutation<
      HistoryItem,
      string | AddSearchHistoryRequest
    >({
      query: (arg) => {
        const text = typeof arg === "string" ? arg : arg.searchText ?? arg.query ?? "";
        return {
          url: `${SEARCH_HISTORY_BASE_URL}`,
          method: "POST",
          body: { type: "query", query: text },
        };
      },
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    getSearchHistories: builder.query<HistoryItem[], void>({
      query: () => `${SEARCH_HISTORY_BASE_URL}`,
      transformResponse: (response: unknown) =>
        unwrapList<HistoryItem>(response),
      providesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteSearchHistory: builder.mutation<
      { message: string; id: string },
      string | number | DeleteSearchHistoryRequest
    >({
      query: (arg) => {
        let id = "";
        if (typeof arg === "object" && arg !== null) {
          id = String(arg.searchHistoryId ?? arg.id ?? "");
        } else {
          id = String(arg);
        }
        return {
          url: `${SEARCH_HISTORY_BASE_URL}/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteSearchHistories: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `${SEARCH_HISTORY_BASE_URL}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    addUserSearchHistory: builder.mutation<
      HistoryItem,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >({
      query: (arg) => {
        if (arg && arg.type === "user") {
          return {
            url: `${SEARCH_HISTORY_BASE_URL}`,
            method: "POST",
            body: arg,
          };
        }
        const userObj = arg.user ?? arg;
        return {
          url: `${SEARCH_HISTORY_BASE_URL}`,
          method: "POST",
          body: {
            type: "user",
            user: userObj,
          },
        };
      },
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    getUserSearchHistories: builder.query<HistoryItem[], void>({
      query: () => `${SEARCH_HISTORY_BASE_URL}`,
      transformResponse: (response: unknown) =>
        unwrapList<HistoryItem>(response),
      providesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteUserSearchHistory: builder.mutation<
      { message: string; id: string },
      string | number
    >({
      query: (id) => ({
        url: `${SEARCH_HISTORY_BASE_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteUserSearchHistories: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `${SEARCH_HISTORY_BASE_URL}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
  }),
});

export const {
  useAddSearchHistoryMutation,
  useAddUserSearchHistoryMutation,
  useDeleteSearchHistoriesMutation,
  useDeleteSearchHistoryMutation,
  useGetSearchHistoriesQuery,
  useGetSearchUsersQuery,
  useGetUserSearchHistoriesQuery,
  useDeleteUserSearchHistoryMutation,
  useDeleteUserSearchHistoriesMutation,
} = searchApi;

// Alias: useGetUsersQuery -> useGetSearchUsersQuery (backward compatibility for all components)
export const useGetUsersQuery = useGetSearchUsersQuery;
