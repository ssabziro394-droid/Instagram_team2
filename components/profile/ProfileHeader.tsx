"use client";

import { Archive, Settings } from "lucide-react";
import type { UserProfile } from "@/types/profile";

type ProfileHeaderProps = {
  profile: UserProfile | null;
  isLoading?: boolean;
  onEdit: () => void;
};

function getDisplayName(profile: UserProfile) {
  return (
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  );
}

function getUsername(profile: UserProfile) {
  return profile.username || profile.userName || "Профиль";
}

function getBio(profile: UserProfile) {
  return profile.bio || profile.about || "";
}

function getAvatarUrl(profile: UserProfile) {
  return (
    profile.avatar ||
    profile.image ||
    profile.avatarUrl ||
    profile.imageUrl ||
    ""
  );
}

function getPostsCount(profile: UserProfile) {
  return profile.postsCount ?? profile.postCount ?? 0;
}

function getFollowersCount(profile: UserProfile) {
  return profile.followersCount ?? profile.subscribersCount ?? 0;
}

function getFollowingCount(profile: UserProfile) {
  return profile.followingCount ?? profile.subscriptionsCount ?? 0;
}

function formatCount(count: number) {
  return new Intl.NumberFormat("ru-RU").format(count);
}

function ProfileHeaderSkeleton() {
  return (
    <section className="border-b border-ig-border px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto flex max-w-4xl gap-8 sm:gap-14">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-ig-card-bg sm:h-36 sm:w-36" />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="h-8 w-44 animate-pulse rounded bg-ig-card-bg" />
          <div className="grid max-w-md grid-cols-2 gap-2">
            <div className="h-8 animate-pulse rounded-lg bg-ig-card-bg" />
            <div className="h-8 animate-pulse rounded-lg bg-ig-card-bg" />
          </div>
          <div className="flex gap-8">
            <div className="h-4 w-20 animate-pulse rounded bg-ig-card-bg" />
            <div className="h-4 w-24 animate-pulse rounded bg-ig-card-bg" />
            <div className="h-4 w-20 animate-pulse rounded bg-ig-card-bg" />
          </div>
          <div className="h-4 w-36 animate-pulse rounded bg-ig-card-bg" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-ig-card-bg" />
        </div>
      </div>
    </section>
  );
}

export default function ProfileHeader({
  profile,
  isLoading = false,
  onEdit,
}: ProfileHeaderProps) {
  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profile) {
    return null;
  }

  const username = getUsername(profile);
  const displayName = getDisplayName(profile);
  const bio = getBio(profile);
  const avatarUrl = getAvatarUrl(profile);
  const initial = username.charAt(0).toUpperCase();

  return (
    <section className="border-b border-ig-border px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-7 sm:flex-row sm:items-start sm:gap-14">
        <div className="flex justify-center sm:w-40 sm:justify-start lg:w-52">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-ig-border bg-ig-card-bg bg-cover bg-center text-4xl font-semibold text-ig-secondary sm:h-36 sm:w-36 lg:h-40 lg:w-40"
            style={
              avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined
            }
            aria-label={`${username} avatar`}
          >
            {!avatarUrl && initial}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex min-w-0 items-center justify-center gap-3 sm:justify-start">
            <h1 className="min-w-0 truncate text-2xl font-normal text-ig-fg sm:text-3xl">
              {username}
            </h1>
            <button
              type="button"
              className="rounded-full p-2 text-ig-fg transition hover:bg-zinc-900 hover:text-white"
              aria-label="Настройки профиля"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:max-w-lg">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-ig-sidebar-hover px-4 text-sm font-semibold text-ig-fg transition hover:bg-zinc-700"
            >
              Редактировать профиль
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-ig-sidebar-hover px-4 text-sm font-semibold text-ig-fg transition hover:bg-zinc-700"
            >
              <Archive className="h-4 w-4" />
              Посмотреть архив
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-y border-ig-border py-3 text-center text-sm sm:flex sm:border-y-0 sm:py-0 sm:text-left">
            <span>
              <strong className="font-semibold text-ig-fg">
                {formatCount(getPostsCount(profile))}
              </strong>{" "}
              <span className="text-ig-fg">публикаций</span>
            </span>
            <span>
              <strong className="font-semibold text-ig-fg">
                {formatCount(getFollowersCount(profile))}
              </strong>{" "}
              <span className="text-ig-fg">подписчиков</span>
            </span>
            <span>
              <strong className="font-semibold text-ig-fg">
                {formatCount(getFollowingCount(profile))}
              </strong>{" "}
              <span className="text-ig-fg">подписок</span>
            </span>
          </div>

          <div className="text-sm leading-5">
            {displayName && (
              <p className="font-semibold text-ig-fg">{displayName}</p>
            )}
            {profile.occupation && (
              <p className="text-ig-secondary">{profile.occupation}</p>
            )}
            {bio ? (
              <p className="mt-1 whitespace-pre-line text-zinc-200">{bio}</p>
            ) : (
              <p className="mt-1 text-ig-secondary">Описание пока не добавлено.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
