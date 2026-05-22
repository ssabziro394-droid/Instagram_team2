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
  useGetUsersQuery,
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
  const [deletingHistoryId, setDeletingHistoryId] = useState("");

  const usersQuery = useGetUsersQuery(
    { search: query, pageSize: 20 },
    { skip: query.length === 0 }
  );
  const historiesQuery = useGetSearchHistoriesQuery();
  const [addSearchHistory] = useAddSearchHistoryMutation();
  const [addUserSearchHistory] = useAddUserSearchHistoryMutation();
  const [deleteSearchHistory] = useDeleteSearchHistoryMutation();
  const [deleteSearchHistories] = useDeleteSearchHistoriesMutation();

  const users = useMemo(() => {
    if (query.length === 0) {
      return [];
    }

    const source = usersQuery.data ?? [];
    const filtered = source.filter((user) => matchesQuery(user, query));

    return filtered.length > 0 ? filtered : source;
  }, [query, usersQuery.data]);

  const handleDebouncedChange = useCallback((value: string) => {
    setQuery(value);
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
      const username = getUsername(user);

      try {
        if (userId) {
          await addUserSearchHistory({
            userId,
            searchedUserId: userId,
          }).unwrap();
        } else {
          await addSearchHistory({
            searchText: username || query,
            query: username || query,
          }).unwrap();
        }
      } catch {
        // Navigation should still work if history persistence is unavailable.
      }

      navigateToUser(user);
    },
    [addSearchHistory, addUserSearchHistory, navigateToUser, query]
  );

  const handleSelectHistory = useCallback(
    (history: SearchHistory) => {
      navigateToUser(getHistoryUser(history));
    },
    [navigateToUser]
  );

  const handleDeleteHistory = useCallback(
    async (history: SearchHistory) => {
      const historyId = getHistoryId(history);
      if (!historyId) {
        return;
      }

      setDeletingHistoryId(historyId);
      try {
        await deleteSearchHistory({ id: historyId }).unwrap();
      } catch {
        // Keep the current list visible if the backend cannot delete the item.
      } finally {
        setDeletingHistoryId("");
      }
    },
    [deleteSearchHistory]
  );

  const handleClearHistory = useCallback(async () => {
    try {
      await deleteSearchHistories().unwrap();
    } catch {
      // Keep recent searches visible if the backend cannot clear them.
    }
  }, [deleteSearchHistories]);

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">Search</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Find people and return to recent profile searches.
        </p>
      </div>

      <SearchBar onDebouncedChange={handleDebouncedChange} />

      <SearchResults
        query={query}
        users={users}
        histories={historiesQuery.data ?? []}
        isLoading={usersQuery.isLoading || usersQuery.isFetching}
        isError={usersQuery.isError}
        deletingHistoryId={deletingHistoryId}
        onSelectUser={handleSelectUser}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
