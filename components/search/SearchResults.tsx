"use client";

import { Search, X, BadgeCheck, Loader2 } from "lucide-react";
import { getFileUrl } from "@/lib/file";
import type { HistoryItem, SearchUser } from "@/types/search";

type SearchResultsProps = {
  query: string;
  users: SearchUser[];
  histories: HistoryItem[];
  isLoading?: boolean;
  isError?: boolean;
  deletingHistoryId?: string;
  onSelectUser: (user: SearchUser) => void;
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
};

// ─── helpers ───────────────────────────────────────────────────────────────

function getId(user: any) {
  const id = user.id ?? user.Id ?? user.userId ?? user.UserId;
  return id === undefined || id === null ? "" : String(id);
}

function getUsername(user: any) {
  return user.username ?? user.userName ?? user.UserName ?? "";
}

function getFullName(user: any) {
  return (
    user.fullName ??
    user.FullName ??
    user.fullname ??
    user.name ??
    user.Name ??
    [user.firstName ?? user.FirstName, user.lastName ?? user.LastName].filter(Boolean).join(" ")
  );
}

function getAvatarFilename(user: any) {
  return (
    user.avatar ??
    user.Avatar ??
    user.avatarUrl ??
    user.AvatarUrl ??
    user.userImage ??
    user.UserImage ??
    user.image ??
    user.Image ??
    user.imageUrl ??
    user.ImageUrl ??
    null
  );
}

function formatFollowers(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(".0", "")} млн`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс.`;
  return String(n);
}

function getSubline(user: any): string {
  const parts: string[] = [];
  const fullName = getFullName(user);
  if (fullName) parts.push(fullName);

  const followers =
    user.followers ??
    user.followersCount ??
    user.FollowersCount ??
    user.subscribersCount ??
    user.SubscribersCount;

  if (followers !== undefined && followers !== null && followers !== "") {
    parts.push(`${formatFollowers(Number(followers))} подписчиков`);
  } else if (user.bio ?? user.Bio) {
    parts.push(user.bio ?? user.Bio);
  }
  return parts.join(" • ");
}

function historyUser(history: SearchHistory): SearchUser {
  console.log(history);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Avatar({ user, size = 44 }: { user: any; size?: number }) {
  const filename = getAvatarFilename(user);
  const avatarUrl = getFileUrl(filename, "avatar");
  const username = getUsername(user);
  const initials = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {filename && avatarUrl && !avatarUrl.startsWith("data:image/svg") ? (
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
    <div className="shrink-0 w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center">
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  onClick: () => void;
  rightSlot?: React.ReactNode;
}) {
  const username = getUsername(user);
  const subline = getSubline(user);
  const isVerified =
    user.isVerified ||
    user.IsVerified ||
    user.verified ||
    user.Verified ||
    user.isFamous ||
    user.IsFamous ||
    false;

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
            <span className="text-sm font-semibold text-white truncate">
              {username}
            </span>
            {isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-ig-bg shrink-0" />
            )}
          </div>
          {subline && (
            <span className="text-xs text-zinc-500 block truncate mt-0.5">
              {subline}
            </span>
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
            <p className="text-sm font-semibold text-white">
              Результаты не найдены
            </p>
            <p className="text-sm text-zinc-500">Поиск: «{query}»</p>
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
  console.log(histories);

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

      <div className="divide-y divide-zinc-900">
        {histories.map((item, i) => {
          const hid = item.id;
          const isDeleting = !!hid && deletingHistoryId === hid;

          // ── Text query item ──
          if (item.type === "query") {
            const text = item.query ?? "";
            return (
              <div
                key={hid || `query-${text}-${i}`}
                className="flex items-center hover:bg-zinc-900 transition"
              >
                <button
                  type="button"
                  onClick={() => onSelectHistory(item)}
                  className="flex flex-1 items-center gap-3 px-4 py-2.5 text-left"
                >
                  <HistoryTextIcon />
                  <span className="text-sm font-medium text-white truncate">
                    {text}
                  </span>
                </button>
                <DeleteBtn
                  disabled={!hid || isDeleting}
                  onClick={() => onDeleteHistory(item)}
                />
              </div>
            );
          }

          // ── User item ──
          if (item.type === "user" && item.user) {
            const user = item.user;
            return (
              <UserRow
                key={hid || `user-${user.username}-${i}`}
                user={user}
                onClick={() => onSelectHistory(item)}
                rightSlot={
                  <DeleteBtn
                    disabled={!hid || isDeleting}
                    onClick={() => onDeleteHistory(item)}
                  />
                }
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
