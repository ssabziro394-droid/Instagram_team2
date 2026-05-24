"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BadgeCheck, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  useGetSearchUsersQuery,
  useAddUserSearchHistoryMutation,
  useGetUserSearchHistoriesQuery,
  useDeleteUserSearchHistoryMutation,
  useDeleteUserSearchHistoriesMutation,
} from "@/store/api/searchApi";
import { getFileUrl } from "@/lib/file";
import type { SearchUser } from "@/types/search";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUsername(u?: SearchUser): string {
  return u?.username ?? u?.userName ?? "";
}

function getFullName(u?: SearchUser): string {
  return (
    u?.fullName ??
    u?.name ??
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") ??
    ""
  );
}

function getAvatar(u?: SearchUser): string | null {
  return u?.userImage ?? u?.image ?? u?.avatar ?? u?.avatarUrl ?? u?.imageUrl ?? null;
}

function getUserId(u?: SearchUser): string {
  const id = u?.id ?? u?.userId;
  return id === undefined || id === null ? "" : String(id);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UserCard({ user, onClick }: { user: SearchUser; onClick: () => void }) {
  const username = getUsername(user);
  const fullName = getFullName(user);
  const avatar = getAvatar(user);
  const isVerified = !!(user as any).isVerified || !!(user as any).verified || !!(user as any).isFamous;
  const subscribers = (user as any).subscribersCount ?? (user as any).followersCount ?? 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer text-center w-full"
    >
      {/* Avatar with gradient ring */}
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
          <div className="w-full h-full rounded-full p-[2px] bg-zinc-900">
            <img
              src={getFileUrl(avatar, "avatar")}
              alt={username}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
            />
          </div>
        </div>
        {isVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 fill-sky-500 text-zinc-900" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col items-center min-w-0 w-full">
        <div className="flex items-center gap-1 max-w-full">
          <span className="font-semibold text-sm text-white truncate max-w-[90px]">
            {username}
          </span>
          {isVerified && <BadgeCheck className="w-3.5 h-3.5 fill-sky-500 text-zinc-900 shrink-0" />}
        </div>
        {fullName && (
          <span className="text-[11px] text-zinc-400 truncate max-w-[110px]">
            {fullName}
          </span>
        )}
        {subscribers > 0 && (
          <span className="text-[10px] text-zinc-500 mt-0.5">
            {subscribers >= 1000 ? `${(subscribers / 1000).toFixed(1).replace(".0", "")}K` : subscribers} подписчиков
          </span>
        )}
      </div>
    </motion.button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-zinc-800" />
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="h-3.5 w-20 bg-zinc-800 rounded" />
        <div className="h-3 w-14 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleInput = useCallback((val: string) => {
    setQuery(val);
    setPageNumber(1);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 350);
  }, []);

  const usersQuery = useGetSearchUsersQuery(
    { search: debouncedQuery, pageNumber, pageSize: PAGE_SIZE },
    { skip: false }
  );

  // Raw response has pagination info
  const rawResponse = (usersQuery as any).data;
  const users: SearchUser[] = useMemo(() => {
    if (!rawResponse) return [];
    if (Array.isArray(rawResponse)) return rawResponse;
    if (Array.isArray(rawResponse?.data)) return rawResponse.data;
    return [];
  }, [rawResponse]);

  const totalPages: number = useMemo(() => {
    if (!rawResponse) return 1;
    return rawResponse?.totalPage ?? 1;
  }, [rawResponse]);

  const [addUserHistory] = useAddUserSearchHistoryMutation();
  const { data: recentHistories = [] } = useGetUserSearchHistoriesQuery();
  const [deleteHistory] = useDeleteUserSearchHistoryMutation();
  const [clearAllHistories] = useDeleteUserSearchHistoriesMutation();

  const handleUserClick = useCallback(
    async (user: SearchUser) => {
      const uid = getUserId(user);
      if (uid) {
        try { await addUserHistory(uid).unwrap(); } catch {}
      }
      router.push(`/${getUsername(user) || uid}`);
    },
    [addUserHistory, router]
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedQuery.trim()) return users;
    const q = debouncedQuery.toLowerCase();
    return users.filter((u) =>
      [getUsername(u), getFullName(u)].join(" ").toLowerCase().includes(q)
    );
  }, [users, debouncedQuery]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const isLoading = usersQuery.isLoading || usersQuery.isFetching;
  const showSkeleton = isLoading && filteredUsers.length === 0;

  return (
    <main className="flex flex-col min-h-screen bg-ig-bg text-ig-fg">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-ig-bg/95 backdrop-blur-md border-b border-ig-border">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold mb-3">Search</h1>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-ig-fg placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all"
            />
            {query && (
              <button
                onClick={() => { handleInput(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {/* ── Recent History (when no query) ── */}
        {!debouncedQuery.trim() && Array.isArray(recentHistories) && recentHistories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-ig-fg">Recent</span>
              <button
                onClick={() => clearAllHistories()}
                className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-col divide-y divide-zinc-900">
              {recentHistories.slice(0, 8).map((h: any, i: number) => {
                const hUser = h.user ?? h.searchedUser ?? { userName: h.userName ?? h.username ?? h.query };
                const hUsername = getUsername(hUser as SearchUser);
                const hAvatar = getAvatar(hUser as SearchUser);
                const hId = String(h.searchHistoryId ?? h.id ?? i);
                return (
                  <div key={hId} className="flex items-center gap-3 py-2.5 hover:bg-zinc-900/40 rounded-xl px-2 transition-colors group">
                    <Link href={`/${hUsername}`} className="flex flex-1 items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                        <img
                          src={getFileUrl(hAvatar, "avatar")}
                          alt={hUsername}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-ig-fg truncate">{hUsername || "User"}</span>
                    </Link>
                    <button
                      onClick={() => deleteHistory(hId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white p-1 shrink-0"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── User Grid ── */}
        <div>
          {debouncedQuery.trim() && (
            <p className="text-xs text-zinc-500 mb-3">
              {isLoading ? "Searching..." : `${filteredUsers.length} result${filteredUsers.length !== 1 ? "s" : ""} for "${debouncedQuery}"`}
            </p>
          )}

          {/* Skeleton */}
          {showSkeleton && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filteredUsers.length === 0 && debouncedQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Users className="w-12 h-12 text-zinc-700" />
              <p className="font-semibold text-zinc-300">No results found</p>
              <p className="text-sm text-zinc-500">Try a different username or name</p>
            </div>
          )}

          {/* All users grid (2 columns) */}
          {!showSkeleton && filteredUsers.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filteredUsers.map((user, i) => (
                    <motion.div
                      key={getUserId(user) || `${getUsername(user)}-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                    >
                      <UserCard user={user} onClick={() => handleUserClick(user)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pb-6">
                  <button
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1 || isLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-sm text-zinc-400">
                    <span className="font-semibold text-white">{pageNumber}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber === totalPages || isLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Show all users when no query */}
          {!debouncedQuery.trim() && !isLoading && users.length > 0 && (
            <>
              <p className="text-xs text-zinc-500 mb-3">All users</p>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {users.map((user, i) => (
                    <motion.div
                      key={getUserId(user) || `${getUsername(user)}-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                    >
                      <UserCard user={user} onClick={() => handleUserClick(user)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pb-6">
                  <button
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber === 1 || isLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-sm text-zinc-400">
                    <span className="font-semibold text-white">{pageNumber}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber === totalPages || isLoading}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {!debouncedQuery.trim() && showSkeleton && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
