"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import {
  useAddSearchHistoryMutation,
  useAddUserSearchHistoryMutation,
  useDeleteSearchHistoriesMutation,
  useDeleteSearchHistoryMutation,
  useGetSearchHistoriesQuery,
  useGetSearchUsersQuery,
  useGetUserSearchHistoriesQuery,
  useDeleteUserSearchHistoryMutation,
  useDeleteUserSearchHistoriesMutation,
} from "@/store/api/searchApi";
import type { ProfileId } from "@/types/profile";
import type { SearchHistory, SearchUser } from "@/types/search";

function toIdString(id?: ProfileId) {
  return id === undefined || id === null ? "" : String(id);
}

function getUserId(user?: SearchUser) {
  return toIdString(user?.id ?? user?.userId);
}

function getHistoryId(history: SearchHistory) {
  return toIdString(history.searchHistoryId ?? history.id);
}

function getUsername(user?: SearchUser) {
  return user?.username ?? user?.userName ?? "";
}

function getDisplayName(user?: SearchUser) {
  return (
    user?.fullName ??
    user?.name ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  );
}

function getHistoryUser(history: SearchHistory): SearchUser {
  return (
    history.user ??
    history.searchedUser ?? {
      id: history.searchedUserId ?? history.userId,
      username: history.username ?? history.userName ?? history.query,
      userName: history.userName,
      fullName: history.fullName ?? history.searchText,
    }
  );
}

function getProfileSlug(user: SearchUser) {
  return getUsername(user) || getUserId(user);
}

function matchesQuery(user: SearchUser, query: string) {
  const normalizedQuery = query.toLowerCase();
  const searchableText = [
    getUsername(user),
    getDisplayName(user),
    user.bio,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [deletingHistoryId, setDeletingHistoryId] = useState("");

  const usersQuery = useGetSearchUsersQuery(
    { search: query, pageSize: 20 },
    { skip: query.length === 0 }
  );
  
  const textHistoriesQuery = useGetSearchHistoriesQuery();
  const userHistoriesQuery = useGetUserSearchHistoriesQuery();

  const [addSearchHistory] = useAddSearchHistoryMutation();
  const [addUserSearchHistory] = useAddUserSearchHistoryMutation();
  const [deleteSearchHistory] = useDeleteSearchHistoryMutation();
  const [deleteUserSearchHistory] = useDeleteUserSearchHistoryMutation();
  const [deleteSearchHistories] = useDeleteSearchHistoriesMutation();
  const [deleteUserSearchHistories] = useDeleteUserSearchHistoriesMutation();

  const users = useMemo(() => {
    if (query.length === 0) {
      return [];
    }

    const source = usersQuery.data ?? [];
    const filtered = source.filter((user) => matchesQuery(user, query));

    return filtered.length > 0 ? filtered : source;
  }, [query, usersQuery.data]);

  const combinedHistories = useMemo(() => {
    const textHistories = textHistoriesQuery.data ?? [];
    const userHistories = userHistoriesQuery.data ?? [];

    const textItems = textHistories.map((h) => ({
      ...h,
      isText: true,
    }));
    const userItems = userHistories.map((h) => ({
      ...h,
      isText: false,
    }));

    const combined = [...textItems, ...userItems];
    return combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateA && dateB) {
        return dateB - dateA;
      }
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    });
  }, [textHistoriesQuery.data, userHistoriesQuery.data]);

  const handleDebouncedChange = useCallback((value: string) => {
    setQuery(value);
    setSearchInputValue(value);
  }, []);

  const navigateToUser = useCallback(
    (user: SearchUser) => {
      const slug = getProfileSlug(user);
      if (slug) {
        router.push(`/${encodeURIComponent(slug)}`);
      }
    },
    [router]
  );

  const handleSelectUser = useCallback(
    async (user: SearchUser) => {
      const userId = getUserId(user);
      try {
        if (userId) {
          await addUserSearchHistory(userId).unwrap();
        }
      } catch {
        // Navigation should still work if history persistence fails.
      }
      navigateToUser(user);
    },
    [addUserSearchHistory, navigateToUser]
  );

  const handleSelectHistory = useCallback(
    async (history: SearchHistory & { isText?: boolean }) => {
      if (history.isText) {
        const text = history.text ?? history.searchText ?? history.query ?? "";
        setQuery(text);
        setSearchInputValue(text);
        try {
          await addSearchHistory(text).unwrap();
        } catch {
          // Ignore error
        }
      } else {
        const user = getHistoryUser(history);
        const userId = getUserId(user);
        try {
          if (userId) {
            await addUserSearchHistory(userId).unwrap();
          }
        } catch {
          // Ignore error
        }
        navigateToUser(user);
      }
    },
    [addSearchHistory, addUserSearchHistory, navigateToUser]
  );

  const handleDeleteHistory = useCallback(
    async (history: SearchHistory & { isText?: boolean }) => {
      const historyId = getHistoryId(history);
      if (!historyId) {
        return;
      }

      setDeletingHistoryId(historyId);
      try {
        if (history.isText) {
          await deleteSearchHistory(historyId).unwrap();
        } else {
          await deleteUserSearchHistory(historyId).unwrap();
        }
      } catch {
        // Keep the current list visible if the backend cannot delete the item.
      } finally {
        setDeletingHistoryId("");
      }
    },
    [deleteSearchHistory, deleteUserSearchHistory]
  );

  const handleClearHistory = useCallback(async () => {
    try {
      await Promise.all([
        deleteSearchHistories().unwrap(),
        deleteUserSearchHistories().unwrap(),
      ]);
    } catch {
      // Keep recent searches visible if the backend cannot clear them.
    }
  }, [deleteSearchHistories, deleteUserSearchHistories]);

  const handleSearchSubmit = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      try {
        await addSearchHistory(value.trim()).unwrap();
      } catch {
        // Ignore error
      }
    },
    [addSearchHistory]
  );

  return (
    <div className="flex min-h-full flex-col bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-black border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
        <SearchBar
          value={searchInputValue}
          onDebouncedChange={handleDebouncedChange}
          onSearchSubmit={handleSearchSubmit}
          placeholder="Поиск"
        />
      </div>

      {/* Results */}
      <div className="flex-1">
        <SearchResults
          query={query}
          users={users}
          histories={combinedHistories}
          isLoading={usersQuery.isLoading || usersQuery.isFetching}
          isError={usersQuery.isError}
          deletingHistoryId={deletingHistoryId}
          onSelectUser={handleSelectUser}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
