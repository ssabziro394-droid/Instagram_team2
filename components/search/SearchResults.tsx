"use client";

import { Search, X, UserRound, BadgeCheck } from "lucide-react";
import type { SearchHistory, SearchUser } from "@/types/search";

type SearchResultsProps = {
  query: string;
  users: SearchUser[];
  histories: (SearchHistory & { isText?: boolean })[];
  isLoading?: boolean;
  isError?: boolean;
  deletingHistoryId?: string;
  onSelectUser: (user: SearchUser) => void;
  onSelectHistory: (history: SearchHistory & { isText?: boolean }) => void;
  onDeleteHistory: (history: SearchHistory & { isText?: boolean }) => void;
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
  return user.username ?? user.userName ?? "";
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

function getSubtitleText(user: SearchUser) {
  // Return full name, email, or bio / description
  return (
    getFullName(user) ||
    user.email ||
    user.bio ||
    user.description ||
    ""
  );
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 bg-cover bg-center text-sm font-semibold text-zinc-300"
      style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
      aria-label={`${username} avatar`}
    >
      {!avatarUrl && username ? username.charAt(0).toUpperCase() : null}
      {!avatarUrl && !username && <UserRound className="h-5 w-5 text-zinc-500" />}
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
  const subtitle = getSubtitleText(user);
  const isVerified =
    user.isVerified ||
    user.verified ||
    user.isFamous ||
    false;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[64px] w-full items-center gap-3 rounded-lg px-3 text-left transition hover:bg-zinc-900"
    >
      <Avatar user={user} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="block truncate text-sm font-semibold text-white">
            {username}
          </span>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 fill-sky-500 text-black shrink-0" />
          )}
        </span>
        {subtitle && (
          <span className="block truncate text-sm text-zinc-500">
            {subtitle}
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
      <div className="rounded-xl border border-zinc-800 bg-black">
        {isLoading && (
          <div className="flex flex-col gap-1 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex h-[64px] items-center gap-3 px-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-zinc-900" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-zinc-900" />
                  <div className="h-3 w-44 animate-pulse rounded bg-zinc-900" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-zinc-500">
            <Search className="h-8 w-8 text-zinc-600" />
            <p className="text-sm">Search is unavailable right now.</p>
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-zinc-500">
            <p className="text-sm text-zinc-400 font-medium">Ничего не найдено</p>
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
    <div className="rounded-xl border border-zinc-800 bg-black">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Недавнее</h2>
        {histories.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs font-semibold text-sky-500 transition hover:text-sky-400"
          >
            Очистить все
          </button>
        )}
      </div>

      {histories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-zinc-500">
          <p className="text-sm text-zinc-500">Нет недавних запросов.</p>
        </div>
      ) : (
        <div className="p-2">
          {histories.map((history, index) => {
            const historyId = getHistoryId(history);
            
            if (history.isText) {
              const searchText = history.text ?? history.searchText ?? history.query ?? "";
              return (
                <div
                  key={historyId || `text-${searchText}-${index}`}
                  className="group flex h-[64px] items-center gap-2 rounded-lg pr-2 transition hover:bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => onSelectHistory(history)}
                    className="flex flex-1 items-center gap-3 rounded-lg px-3 text-left transition"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {searchText}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistory(history)}
                    disabled={!historyId || deletingHistoryId === historyId}
                    className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Delete recent search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            const user = historyUser(history);
            return (
              <div
                key={historyId || `user-${getUsername(user)}-${index}`}
                className="group flex h-[64px] items-center gap-2 rounded-lg pr-2 transition hover:bg-zinc-900"
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
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Delete recent search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
