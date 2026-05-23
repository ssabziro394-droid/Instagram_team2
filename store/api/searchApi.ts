import { baseApi } from "./baseApi";
import type { ApiMessageResponse } from "@/types/profile";
import type {
  AddSearchHistoryRequest,
  AddUserSearchHistoryRequest,
  DeleteSearchHistoryRequest,
  SearchHistory,
  SearchUser,
  SearchUsersQuery,
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
    search: normalized.search?.trim(),
    pageNumber: normalized.pageNumber,
    pageSize: normalized.pageSize,
  });
}

function historyIdParams(request: DeleteSearchHistoryRequest) {
  const id = request.searchHistoryId ?? request.id;
  return id === undefined || id === null ? undefined : { id };
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSearchUsers: builder.query<SearchUser[], SearchUsersQuery | string | void>({
      query: (query) => ({
        url: "User/get-users",
        params: searchParams(query),
      }),
      transformResponse: (response: unknown) => unwrapList<SearchUser>(response),
      providesTags: [{ type: "User", id: "SEARCH_USERS" }],
    }),
    addSearchHistory: builder.mutation<
      ApiMessageResponse,
      AddSearchHistoryRequest
    >({
      query: (body) => ({
        url: "User/add-search-history",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    getSearchHistories: builder.query<SearchHistory[], void>({
      query: () => "User/get-search-histories",
      transformResponse: (response: unknown) =>
        unwrapList<SearchHistory>(response),
      providesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteSearchHistory: builder.mutation<
      ApiMessageResponse,
      DeleteSearchHistoryRequest
    >({
      query: (body) => ({
        url: "User/delete-search-history",
        method: "DELETE",
        body,
        params: historyIdParams(body),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteSearchHistories: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "User/delete-search-histories",
        method: "DELETE",
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    addUserSearchHistory: builder.mutation<
      ApiMessageResponse,
      AddUserSearchHistoryRequest
    >({
      query: (body) => ({
        url: "User/add-user-search-history",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
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
} = searchApi;
