"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import ExploreGrid from "@/components/explore/ExploreGrid";
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

// ---------------------------------------------------------------------------
// Pure helpers — no side-effects, easy to unit-test
// ---------------------------------------------------------------------------

function toIdString(id?: ProfileId): string {
  return id === undefined || id === null ? "" : String(id);
}

function getUserId(user?: SearchUser): string {
  return toIdString(user?.id ?? user?.userId);
}

function getHistoryId(history: SearchHistory): string {
  return toIdString(history.searchHistoryId ?? history.id);
}

function getUsername(user?: SearchUser): string {
  return user?.username ?? user?.userName ?? "";
}

function getDisplayName(user?: SearchUser): string {
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

function getProfileSlug(user: SearchUser): string {
  return getUsername(user) || getUserId(user);
}

function matchesQuery(user: SearchUser, query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const searchableText = [getUsername(user), getDisplayName(user), user.bio]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CombinedHistory = SearchHistory & { isText: boolean };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExplorePage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [deletingHistoryId, setDeletingHistoryId] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // ── API hooks ──────────────────────────────────────────────────────────────

  const usersQuery = useGetSearchUsersQuery(
    { search: query, pageSize: 20 },
    { skip: query.length === 0 }
  );

  // Both history feeds are always fetched; the UI decides what to show.
  const textHistoriesQuery = useGetSearchHistoriesQuery();
  const userHistoriesQuery = useGetUserSearchHistoriesQuery();

  const [addSearchHistory] = useAddSearchHistoryMutation();
  const [addUserSearchHistory] = useAddUserSearchHistoryMutation();
  const [deleteSearchHistory] = useDeleteSearchHistoryMutation();
  const [deleteUserSearchHistory] = useDeleteUserSearchHistoryMutation();
  const [deleteSearchHistories] = useDeleteSearchHistoriesMutation();
  const [deleteUserSearchHistories] = useDeleteUserSearchHistoriesMutation();

  // ── Derived data ───────────────────────────────────────────────────────────

  const searchResults: SearchUser[] = useMemo(() => {
    const raw = usersQuery.data;
    const users: SearchUser[] = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
    if (!query) return users;
    return users.filter((u) => matchesQuery(u, query));
  }, [usersQuery.data, query]);

  /**
   * Merges text-search histories and user-search histories into a single
   * chronologically-sorted list, newest first.
   */
  const combinedHistories: CombinedHistory[] = useMemo(() => {
    const textItems: CombinedHistory[] = (textHistoriesQuery.data ?? []).map(
      (h) => ({ ...h, isText: true })
    );
    const userItems: CombinedHistory[] = (userHistoriesQuery.data ?? []).map(
      (h) => ({ ...h, isText: false })
    );

    return [...textItems, ...userItems].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (dateA && dateB) return dateB - dateA;

      // Fallback to numeric id comparison when timestamps are absent.
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [textHistoriesQuery.data, userHistoriesQuery.data]);

  // ── Navigation helper ──────────────────────────────────────────────────────

  const navigateToUser = useCallback(
    (user: SearchUser) => {
      router.push(`/${getProfileSlug(user)}`);
    },
    [router]
  );

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleDebouncedChange = useCallback((value: string) => {
    setQuery(value);
    setSearchInputValue(value);
  }, []);

  const handleUserClick = useCallback(
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
    async (history: CombinedHistory) => {
      if (history.isText) {
        const text = history.text ?? history.searchText ?? history.query ?? "";
        setQuery(text);
        setSearchInputValue(text);
        try {
          await addSearchHistory(text).unwrap();
        } catch {
          // Ignore — UI already reflects the selection.
        }
      } else {
        const user = getHistoryUser(history);
        const userId = getUserId(user);
        try {
          if (userId) {
            await addUserSearchHistory(userId).unwrap();
          }
        } catch {
          // Ignore — navigate regardless.
        }
        navigateToUser(user);
      }
    },
    [addSearchHistory, addUserSearchHistory, navigateToUser]
  );

  const handleDeleteHistory = useCallback(
    async (history: CombinedHistory) => {
      const historyId = getHistoryId(history);
      if (!historyId) return;

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

  const handleClearAllHistory = useCallback(async () => {
    try {
      await Promise.all([
        deleteSearchHistories().unwrap(),
        deleteUserSearchHistories().unwrap(),
      ]);
    } catch {
      // Silently ignore — the UI will re-sync on the next fetch.
    }
  }, [deleteSearchHistories, deleteUserSearchHistories]);

  const handleSearchSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        await addSearchHistory(trimmed).unwrap();
      } catch {
        // Ignore.
      }
    },
    [addSearchHistory]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLoading =
    usersQuery.isLoading ||
    usersQuery.isFetching ||
    textHistoriesQuery.isLoading ||
    userHistoriesQuery.isLoading;

  return (
    <div className="flex min-h-full flex-col bg-ig-bg text-ig-fg">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-20 bg-ig-bg/95 backdrop-blur-md border-b border-ig-border">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <SearchBar
            value={searchInputValue}
            onDebouncedChange={handleDebouncedChange}
            onSearchSubmit={handleSearchSubmit}
            onFocus={() => setIsFocused(true)}
            placeholder="🔍  Поиск"
          />
          {isFocused && (
            <button
              onClick={() => {
                setIsFocused(false);
                setQuery("");
                setSearchInputValue("");
              }}
              className="text-sm font-semibold text-sky-500 hover:text-sky-400 transition-colors shrink-0"
            >
              Отмена
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 relative">
        {/* Grid is always visible underneath */}
        <div className="w-full pb-20 md:pb-4">
          <ExploreGrid />
        </div>

        {/* Search overlay — slides in on top of the grid */}
        {(isFocused || query.trim().length > 0) && (
          <div className="absolute inset-0 z-10 bg-ig-bg animate-in fade-in duration-150">
            <SearchResults
              query={query}
              users={searchResults}
              histories={combinedHistories}
              isLoading={isLoading}
              isError={usersQuery.isError}
              deletingHistoryId={deletingHistoryId}
              onSelectUser={handleUserClick}
              onSelectHistory={handleSelectHistory}
              onDeleteHistory={handleDeleteHistory}
              onClearHistory={handleClearAllHistory}
            />
          </div>
        )}
      </div>
    </div>
  );
}