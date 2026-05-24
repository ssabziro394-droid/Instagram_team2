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
    UserName: normalized.search?.trim(),
    PageNumber: normalized.pageNumber,
    PageSize: normalized.pageSize,
  });
}

function historyIdParams(request: DeleteSearchHistoryRequest | string | number) {
  if (typeof request === "object" && request !== null) {
    const id = request.searchHistoryId ?? request.id;
    return id === undefined || id === null ? undefined : { id };
  }
  return { id: request };
}

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
      ApiMessageResponse,
      string | AddSearchHistoryRequest
    >({
      query: (arg) => {
        const text = typeof arg === "string" ? arg : arg.searchText ?? arg.query ?? "";
        return {
          url: "User/add-search-history",
          method: "POST",
          params: { Text: text },
        };
      },
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
      string | number | DeleteSearchHistoryRequest
    >({
      query: (arg) => ({
        url: "User/delete-search-history",
        method: "DELETE",
        params: historyIdParams(arg),
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
      string | AddUserSearchHistoryRequest
    >({
      query: (arg) => {
        const userSearchId = typeof arg === "string" ? arg : arg.searchedUserId ?? arg.userId ?? "";
        return {
          url: "User/add-user-search-history",
          method: "POST",
          params: { UserSearchId: userSearchId },
        };
      },
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    getUserSearchHistories: builder.query<SearchHistory[], void>({
      query: () => "User/get-user-search-histories",
      transformResponse: (response: unknown) =>
        unwrapList<SearchHistory>(response),
      providesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteUserSearchHistory: builder.mutation<
      ApiMessageResponse,
      string | number
    >({
      query: (id) => ({
        url: "User/delete-user-search-history",
        method: "DELETE",
        params: { id },
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "SEARCH_HISTORY" }],
    }),
    deleteUserSearchHistories: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "User/delete-user-search-histories",
        method: "DELETE",
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
  useGetUserSearchHistoriesQuery,
  useDeleteUserSearchHistoryMutation,
  useDeleteUserSearchHistoriesMutation,
} = searchApi;

// Alias: useGetUsersQuery -> useGetSearchUsersQuery (backward compatibility for all components)
export const useGetUsersQuery = useGetSearchUsersQuery;
