"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/store/api/searchApi";
import type { HistoryItem, HistoryUser, SearchUser } from "@/types/search";

function toIdString(id: SearchUser["id"] | SearchUser["userId"] | undefined) {
  return id === undefined || id === null ? "" : String(id);
}

function getUserId(user?: SearchUser) {
  return toIdString(user?.id ?? user?.userId);
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

function mapUserToHistory(user: SearchUser): HistoryUser {
  const id = getUserId(user);
  const username = getUsername(user);
  const fullname = getDisplayName(user) || "";
  const avatar =
    user.avatar ??
    user.avatarUrl ??
    user.userImage ??
    user.image ??
    user.imageUrl ??
    null;
  const followers = user.followersCount ?? user.subscribersCount ?? 0;
  const isVerified = user.isVerified ?? user.verified ?? user.isFamous ?? false;

  return {
    id,
    username,
    fullname,
    avatar: avatar ? String(avatar) : null,
    followers: Number(followers),
    isVerified: Boolean(isVerified),
  };
}

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
  const historiesQuery = useGetSearchHistoriesQuery();

  const [addSearchHistory] = useAddSearchHistoryMutation();
  const [addUserSearchHistory] = useAddUserSearchHistoryMutation();
  const [deleteSearchHistory] = useDeleteSearchHistoryMutation();
  const [deleteSearchHistories] = useDeleteSearchHistoriesMutation();

  const searchResults: SearchUser[] = useMemo(() => {
    const raw = usersQuery.data;
    const users: SearchUser[] = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
    if (!query) return users;
    return users.filter((u) => matchesQuery(u, query));
  }, [usersQuery.data, query]);

    const timer = window.setTimeout(() => {
      setLocalHistories(historiesQuery.data ?? []);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [historiesQuery.data]);

  const users = useMemo(() => {
    const source = usersQuery.data ?? [];
    if (!query) {
      return source;
    }

    const filtered = source.filter((user) => matchesQuery(user, query));
    return filtered.length > 0 ? filtered : source;
  }, [query, usersQuery.data]);

  const handleDebouncedChange = useCallback((value: string) => {
    setQuery(value);
    setSearchInputValue(value);
  }, []);

  const navigateToUser = useCallback(
    (user: SearchUser) => {
      router.push(`/${getProfileSlug(user)}`);
    },
    [router]
  );

  const handleSelectUser = useCallback(
    async (user: SearchUser) => {
      const mapped = mapUserToHistory(user);

      if (!mapped.id) {
        navigateToUser(user);
        return;
      }

      setLocalHistories((prev) => {
        const filtered = prev.filter(
          (item) => !(item.type === "user" && item.user?.id === mapped.id)
        );
        const newItem: HistoryItem = {
          id: `temp-user-${Date.now()}`,
          type: "user",
          user: mapped,
          createdAt: Math.floor(Date.now() / 1000),
        };
        return [newItem, ...filtered];
      });

      try {
        await addUserSearchHistory({ type: "user", user: mapped }).unwrap();
      } catch (error) {
        console.error("Failed to add user to search history backend:", error);
      }

      navigateToUser(user);
    },
    [addUserSearchHistory, navigateToUser]
  );

  const handleSelectHistory = useCallback(
    async (item: HistoryItem) => {
      if (item.type === "query") {
        const text = item.query ?? "";

        setQuery(text);
        setSearchInputValue(text);
        setLocalHistories((prev) => {
          const filtered = prev.filter(
            (history) => !(history.type === "query" && history.query === text)
          );
          const newItem: HistoryItem = {
            id: `temp-query-${Date.now()}`,
            type: "query",
            query: text,
            createdAt: Math.floor(Date.now() / 1000),
          };
          return [newItem, ...filtered];
        });

        try {
          await addSearchHistory(text).unwrap();
        } catch (error) {
          console.error("Failed to add query to search history backend:", error);
        }

        return;
      }

      if (item.type === "user" && item.user) {
        const user = item.user;

        setLocalHistories((prev) => {
          const filtered = prev.filter(
            (history) => !(history.type === "user" && history.user?.id === user.id)
          );
          const newItem: HistoryItem = {
            id: `temp-user-${Date.now()}`,
            type: "user",
            user,
            createdAt: Math.floor(Date.now() / 1000),
          };
          return [newItem, ...filtered];
        });

        try {
          await addUserSearchHistory({ type: "user", user }).unwrap();
        } catch (error) {
          console.error("Failed to update user history timestamp backend:", error);
        }

        const slug = user.username || user.id;
        if (slug) {
          const queryParam = user.id ? `?id=${encodeURIComponent(user.id)}` : "";
          router.push(`/${encodeURIComponent(slug)}${queryParam}`);
        }
      }
    },
    [addSearchHistory, addUserSearchHistory, router]
  );

  const handleDeleteHistory = useCallback(
    async (item: HistoryItem) => {
      const id = item.id;
      if (!id) {
        return;
      }

      setLocalHistories((prev) => prev.filter((history) => history.id !== id));
      setDeletingHistoryId(id);

      try {
        await deleteSearchHistory(id).unwrap();
      } catch (error) {
        console.error("Failed to delete history item backend:", error);
      } finally {
        setDeletingHistoryId("");
      }
    },
    [deleteSearchHistory]
  );

  const handleClearHistory = useCallback(async () => {
    setLocalHistories([]);

    try {
      await deleteSearchHistories().unwrap();
    } catch (error) {
      console.error("Failed to clear search histories backend:", error);
    }
  }, [deleteSearchHistories]);

  const handleSearchSubmit = useCallback(
    async (value: string) => {
      const text = value.trim();
      if (!text) {
        return;
      }

      setLocalHistories((prev) => {
        const filtered = prev.filter(
          (item) => !(item.type === "query" && item.query === text)
        );
        const newItem: HistoryItem = {
          id: `temp-query-${Date.now()}`,
          type: "query",
          query: text,
          createdAt: Math.floor(Date.now() / 1000),
        };
        return [newItem, ...filtered];
      });

      try {
        await addSearchHistory(text).unwrap();
      } catch (error) {
        console.error("Failed to save search text query on submit:", error);
      }
    },
    [addSearchHistory]
  );

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
