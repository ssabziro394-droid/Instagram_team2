"use client";

import { Search, X, BadgeCheck, Loader2 } from "lucide-react";
import { getFileUrl } from "@/lib/file";
import type { SearchHistory, SearchUser } from "@/types/search";

type SearchResultsProps = {
  query: string;
  users: SearchUser[];
  histories: (SearchHistory & { isText: boolean })[];
  isLoading?: boolean;
  isError?: boolean;
  deletingHistoryId?: string;
  onSelectUser: (user: SearchUser) => void;
  onSelectHistory: (history: SearchHistory & { isText: boolean }) => void;
  onDeleteHistory: (history: SearchHistory & { isText: boolean }) => void;
  onClearHistory: () => void;
};

// ─── helpers ───────────────────────────────────────────────────────────────

function getId(user: SearchUser) {
  const id = user.id ?? user.userId;
  return id === undefined || id === null ? "" : String(id);
}

function getHistoryId(h: SearchHistory) {
  const id = h.searchHistoryId ?? h.id;
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

function getAvatarFilename(user: SearchUser) {
  return (
    user.userImage ??
    user.image ??
    user.avatar ??
    user.avatarUrl ??
    user.imageUrl ??
    null
  );
}

function formatFollowers(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")} млн`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс.`;
  return String(n);
}

function getSubline(user: SearchUser): string {
  const parts: string[] = [];
  const fullName = getFullName(user);
  if (fullName) parts.push(fullName);

  const followers = user.followersCount ?? user.subscribersCount;
  if (followers) {
    parts.push(`${formatFollowers(followers)} подписчиков`);
  } else if (user.bio) {
    parts.push(user.bio);
  }
  return parts.join(" • ");
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

// ─── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ user, size = 44 }: { user: SearchUser; size?: number }) {
  const filename = getAvatarFilename(user);
  const avatarUrl = getFileUrl(filename, "avatar");
  const username = getUsername(user);
  const initials = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {avatarUrl && !avatarUrl.startsWith("data:image/svg") ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="text-sm font-semibold text-zinc-300">{initials}</span>
      )}
    </div>
  );
}

// ─── HistoryTextIcon ────────────────────────────────────────────────────────

function HistoryTextIcon() {
  return (
    <div className="shrink-0 w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center">
      <Search className="h-5 w-5 text-zinc-300" />
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-11 h-11 rounded-full bg-ig-sidebar-hover animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-28 rounded bg-ig-sidebar-hover animate-pulse" />
        <div className="h-3 w-40 rounded bg-ig-sidebar-hover animate-pulse" />
      </div>
    </div>
  );
}

// ─── UserRow ────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onClick,
  rightSlot,
}: {
  user: SearchUser;
  onClick: () => void;
  rightSlot?: React.ReactNode;
}) {
  const username = getUsername(user);
  const subline = getSubline(user);
  const isVerified = user.isVerified || user.verified || user.isFamous || false;

  return (
    <div className="flex items-center gap-1 hover:bg-ig-sidebar-hover transition rounded-none">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-3 px-4 py-2.5 text-left"
      >
        <Avatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-ig-fg truncate">{username}</span>
            {isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-ig-bg shrink-0" />
            )}
          </div>
          {subline && (
            <span className="text-xs text-ig-secondary block truncate mt-0.5">{subline}</span>
          )}
        </div>
      </button>
      {rightSlot}
    </div>
  );
}

// ─── DeleteButton ───────────────────────────────────────────────────────────

function DeleteBtn({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mr-3 shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-zinc-400 hover:text-white transition disabled:opacity-40"
      aria-label="Удалить"
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

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

  // ── Search results ──────────────────────────────────────────────────────
  if (hasQuery) {
    return (
      <div className="divide-y divide-zinc-900">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-ig-secondary" />
            <p className="text-sm text-ig-secondary">Поиск временно недоступен</p>
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-semibold text-ig-fg">Результаты не найдены</p>
            <p className="text-sm text-ig-secondary">Поиск: «{query}»</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          users.map((user, i) => (
            <UserRow
              key={getId(user) || `${getUsername(user)}-${i}`}
              user={user}
              onClick={() => onSelectUser(user)}
            />
          ))}
      </div>
    );
  }

  // ── Recent history ──────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ig-border">
        <span className="text-sm font-semibold text-ig-fg">Недавнее</span>
        {histories.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-sm font-semibold text-sky-500 hover:text-sky-400 transition"
          >
            Очистить все
          </button>
        )}
      </div>

      {histories.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-ig-secondary">Нет недавних запросов</p>
        </div>
      )}

      <div className="divide-y divide-ig-border">
        {histories.map((history, i) => {
          const hid = getHistoryId(history);
          const isDeleting = !!hid && deletingHistoryId === hid;

          // Text search item
          if (history.isText) {
            const text =
              history.text ?? history.searchText ?? history.query ?? "";
            return (
              <div
                key={hid || `text-${text}-${i}`}
                className="flex items-center hover:bg-zinc-900 transition"
              >
                <button
                  type="button"
                  onClick={() => onSelectHistory(history)}
                  className="flex flex-1 items-center gap-3 px-4 py-2.5 text-left"
                >
                  <HistoryTextIcon />
                  <span className="text-sm font-medium text-white truncate">{text}</span>
                </button>
                <DeleteBtn
                  disabled={!hid || isDeleting}
                  onClick={() => onDeleteHistory(history)}
                />
              </div>
            );
          }

          // User history item
          const user = historyUser(history);
          return (
            <UserRow
              key={hid || `user-${getUsername(user)}-${i}`}
              user={user}
              onClick={() => onSelectHistory(history)}
              rightSlot={
                <DeleteBtn
                  disabled={!hid || isDeleting}
                  onClick={() => onDeleteHistory(history)}
                />
              }
            />
          );
        })}
      </div>
    </div>
  );
}
