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
  const searchableText = [getUsername(user), getDisplayName(user), user.bio]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deletingHistoryId, setDeletingHistoryId] = useState("");

  const usersQuery = useGetSearchUsersQuery(
    { search: query, pageSize: 20 },
    { skip: query.length === 0 }
  );

  const historiesQuery = useGetSearchHistoriesQuery(undefined, {
    skip: query.length > 0,
  });

  const [addSearchHistory] = useAddSearchHistoryMutation();
  const [addUserSearchHistory] = useAddUserSearchHistoryMutation();
  const [deleteSearchHistory] = useDeleteSearchHistoryMutation();
  const [deleteSearchHistories] = useDeleteSearchHistoriesMutation();

  const searchResults: SearchUser[] = useMemo(() => {
    const users = usersQuery.data ?? [];
    if (!query) return users;
    return users.filter((u) => matchesQuery(u, query));
  }, [usersQuery.data, query]);

  const searchHistories: SearchHistory[] = useMemo(() => {
    return historiesQuery.data ?? [];
  }, [historiesQuery.data]);

  const handleUserClick = useCallback(
    async (user: SearchUser) => {
      try {
        const id = getUserId(user);
        if (id) {
          await addUserSearchHistory({ userId: id }).unwrap();
        } else {
          await addSearchHistory({ query: getUsername(user) }).unwrap();
        }
      } catch {
        // silently ignore history save errors
      }
      router.push(`/profile/${getProfileSlug(user)}`);
    },
    [router, addSearchHistory, addUserSearchHistory]
  );

  const handleDeleteHistory = useCallback(
    async (history: SearchHistory) => {
      const id = getHistoryId(history);
      if (!id) return;
      setDeletingHistoryId(id);
      try {
        await deleteSearchHistory({ id }).unwrap();
      } finally {
        setDeletingHistoryId("");
      }
    },
    [deleteSearchHistory]
  );

  const handleClearAllHistory = useCallback(async () => {
    try {
      await deleteSearchHistories({}).unwrap();
    } catch {
      // silently ignore
    }
  }, [deleteSearchHistories]);

  return (
    <div className="w-full min-h-screen bg-ig-bg text-ig-fg">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <SearchBar
          query={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
        />
        <SearchResults
          query={query}
          searchResults={searchResults}
          searchHistories={searchHistories}
          isLoading={usersQuery.isFetching || historiesQuery.isFetching}
          deletingHistoryId={deletingHistoryId}
          onUserClick={handleUserClick}
          onDeleteHistory={handleDeleteHistory}
          onClearAllHistory={handleClearAllHistory}
        />
      </div>
    </div>
  );
}