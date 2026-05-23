"use client";

import { Clock, Search, Trash2, UserRound } from "lucide-react";
import type { SearchHistory, SearchUser } from "@/types/search";

type SearchResultsProps = {
  query: string;
  users: SearchUser[];
  histories: SearchHistory[];
  isLoading?: boolean;
  isError?: boolean;
  deletingHistoryId?: string;
  onSelectUser: (user: SearchUser) => void;
  onSelectHistory: (history: SearchHistory) => void;
  onDeleteHistory: (history: SearchHistory) => void;
  onClearHistory: () => void;
};

function getUserId(user: SearchUser) {
  const id = user.id ?? user.userId;
  return id === undefined || id === null ? "" : String(id);
}

function getHistoryId(history: SearchHistory) {
  const id = history.searchHistoryId ?? history.id;
  return id === undefined || id === null ? "" : String(id);
}

function getUsername(user: SearchUser) {
  return user.username ?? user.userName ?? "user";
}

function getFullName(user: SearchUser) {
  return (
    user.fullName ??
    user.name ??
    [user.firstName, user.lastName].filter(Boolean).join(" ")
  );
}

function getAvatarUrl(user: SearchUser) {
  return user.avatarUrl ?? user.imageUrl ?? user.image ?? user.avatar ?? "";
}

function historyUser(history: SearchHistory): SearchUser {
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

function Avatar({ user }: { user: SearchUser }) {
  const username = getUsername(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ig-sidebar-hover bg-cover bg-center text-sm font-semibold text-ig-secondary"
      style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
      aria-label={`${username} avatar`}
    >
      {!avatarUrl && username.charAt(0).toUpperCase()}
    </div>
  );
}

function UserRow({
  user,
  onClick,
}: {
  user: SearchUser;
  onClick: () => void;
}) {
  const username = getUsername(user);
  const fullName = getFullName(user);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-zinc-900"
    >
      <Avatar user={user} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ig-fg">
          {username}
        </span>
        {fullName && (
          <span className="block truncate text-sm text-ig-secondary">
            {fullName}
          </span>
        )}
      </span>
    </button>
  );
}

export default function SearchResults({
  query,
  users,
  histories,
  isLoading = false,
  isError = false,
  deletingHistoryId,
  onSelectUser,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
}: SearchResultsProps) {
  const hasQuery = query.length > 0;

  if (hasQuery) {
    return (
      <div className="rounded-lg border border-ig-border bg-ig-bg">
        {isLoading && (
          <div className="flex flex-col gap-1 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-ig-sidebar-hover" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-ig-sidebar-hover" />
                  <div className="h-3 w-44 animate-pulse rounded bg-ig-sidebar-hover" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ig-secondary">
            <Search className="h-8 w-8" />
            <p className="text-sm">Search is unavailable right now.</p>
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ig-secondary">
            <UserRound className="h-8 w-8" />
            <p className="text-sm">No users found.</p>
          </div>
        )}

        {!isLoading && !isError && users.length > 0 && (
          <div className="p-2">
            {users.map((user, index) => (
              <UserRow
                key={getUserId(user) || `${getUsername(user)}-${index}`}
                user={user}
                onClick={() => onSelectUser(user)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ig-border bg-ig-bg">
      <div className="flex items-center justify-between border-b border-ig-border px-4 py-3">
        <h2 className="text-sm font-semibold text-ig-fg">Recent</h2>
        {histories.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-sm font-semibold text-sky-400 transition hover:text-sky-300"
          >
            Clear all
          </button>
        )}
      </div>

      {histories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ig-secondary">
          <Clock className="h-8 w-8" />
          <p className="text-sm">No recent searches.</p>
        </div>
      ) : (
        <div className="p-2">
          {histories.map((history, index) => {
            const user = historyUser(history);
            const historyId = getHistoryId(history);

            return (
              <div
                key={historyId || `${getUsername(user)}-${index}`}
                className="group flex items-center gap-2 rounded-lg pr-2 transition hover:bg-zinc-900"
              >
                <div className="min-w-0 flex-1">
                  <UserRow
                    user={user}
                    onClick={() => onSelectHistory(history)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteHistory(history)}
                  disabled={!historyId || deletingHistoryId === historyId}
                  className="rounded-full p-2 text-ig-secondary opacity-100 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Delete recent search"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
