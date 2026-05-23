"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowLeft } from "lucide-react";
import ExploreGrid from "@/components/explore/ExploreGrid";
import {
  useAddSearchHistoryMutation,
  useAddUserSearchHistoryMutation,
  useDeleteSearchHistoriesMutation,
  useDeleteSearchHistoryMutation,
  useGetSearchHistoriesQuery,
  useGetSearchUsersQuery,
} from "@/store/api/searchApi";
import { getFileUrl } from "@/lib/file";
import type { ProfileId } from "@/types/profile";
import type { SearchHistory, SearchUser } from "@/types/search";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function getProfileSlug(user: SearchUser) {
  return getUsername(user) || getUserId(user);
}
function matchesQuery(user: SearchUser, query: string) {
  const q = query.toLowerCase();
  return [getUsername(user), getDisplayName(user), user.bio]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState("");

  const isSearchActive = isFocused || query.length > 0;

  const usersQuery = useGetSearchUsersQuery(
    { search: query, pageSize: 20 },
    { skip: query.length < 1 }
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

  const searchHistories: SearchHistory[] = useMemo(
    () => historiesQuery.data ?? [],
    [historiesQuery.data]
  );

  const handleUserClick = useCallback(
    async (user: SearchUser) => {
      try {
        const id = getUserId(user);
        if (id) await addUserSearchHistory({ userId: id }).unwrap();
        else await addSearchHistory({ query: getUsername(user) }).unwrap();
      } catch { /* silent */ }
      setIsFocused(false);
      setQuery("");
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

  const handleClearAll = useCallback(async () => {
    try { await deleteSearchHistories({}).unwrap(); } catch { /* silent */ }
  }, [deleteSearchHistories]);

  const handleCancel = () => {
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div className="w-full min-h-screen bg-ig-bg text-ig-fg">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-ig-bg border-b border-ig-border px-4 py-2 flex items-center gap-2">
        {isSearchActive && (
          <button
            onClick={handleCancel}
            className="text-ig-fg shrink-0 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Search input */}
        <div className="relative flex-1">
          {!isFocused && !query && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ig-secondary pointer-events-none" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search"
            className="w-full h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-sm text-ig-fg placeholder:text-ig-secondary outline-none transition-all px-4 pl-9"
            style={{ paddingLeft: isFocused || query ? "12px" : undefined }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ig-secondary hover:text-ig-fg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearchActive && (
          <button
            onClick={handleCancel}
            className="text-sm font-medium text-ig-fg shrink-0 hidden md:block"
          >
            Cancel
          </button>
        )}
      </div>

      {/* ── Search Results Overlay ── */}
      {isSearchActive ? (
        <div className="w-full max-w-lg mx-auto px-0">
          {/* Loading */}
          {(usersQuery.isFetching || historiesQuery.isFetching) && (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-11 h-11 rounded-full bg-ig-sidebar-hover animate-pulse shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-24 bg-ig-sidebar-hover rounded animate-pulse" />
                    <div className="h-2.5 w-36 bg-ig-sidebar-hover rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search results (typing) */}
          {query.length > 0 && !usersQuery.isFetching && (
            <>
              {searchResults.length === 0 ? (
                <div className="px-4 py-10 text-center text-ig-secondary text-sm">
                  No results for &ldquo;<span className="text-ig-fg font-medium">{query}</span>&rdquo;.
                </div>
              ) : (
                <div>
                  {searchResults.map((user, i) => {
                    const username = getUsername(user);
                    const displayName = getDisplayName(user);
                    const userId = getUserId(user);
                    return (
                      <button
                        key={userId || i}
                        onClick={() => handleUserClick(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-sidebar-hover transition-colors text-left"
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-ig-sidebar-hover border border-ig-border shrink-0">
                          <img
                            src={getFileUrl(user.userImage ?? user.image ?? null, "avatar")}
                            alt={username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = getFileUrl(null, "avatar");
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-ig-fg truncate">
                            {username}
                          </span>
                          {displayName && (
                            <span className="text-xs text-ig-secondary truncate">
                              {displayName}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Recent history (focused, no query) */}
          {query.length === 0 && !historiesQuery.isFetching && (
            <>
              {searchHistories.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border">
                    <span className="font-semibold text-sm text-ig-fg">Recent</span>
                    <button
                      onClick={handleClearAll}
                      className="text-sm font-semibold text-sky-500 hover:text-sky-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  {searchHistories.map((history, i) => {
                    const hId = getHistoryId(history);
                    const username =
                      history.userName ??
                      history.username ??
                      history.query ??
                      "User";
                    const histUser = history.user ?? history.searchedUser;
                    const image = histUser?.image ?? histUser?.avatarUrl ?? histUser?.imageUrl ?? null;
                    const isDeleting = deletingHistoryId === hId;
                    return (
                      <div
                        key={hId || i}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-ig-sidebar-hover transition-colors group"
                      >
                        <button
                          onClick={() =>
                            handleUserClick({
                              id: history.searchedUserId ?? history.userId,
                              username: username,
                              image: image ?? undefined,
                            } as SearchUser)
                          }
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-ig-sidebar-hover border border-ig-border shrink-0">
                            <img
                              src={getFileUrl(image, "avatar")}
                              alt={username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = getFileUrl(null, "avatar");
                              }}
                            />
                          </div>
                          <span className="font-semibold text-sm text-ig-fg truncate">
                            {username}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(history)}
                          disabled={isDeleting}
                          className="text-ig-secondary hover:text-ig-fg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-ig-secondary text-sm">
                  No recent searches.
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Explore Grid ── */
        <div className="w-full pb-20 md:pb-4">
          <ExploreGrid />
        </div>
      )}
    </div>
  );
}