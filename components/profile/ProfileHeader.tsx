"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { Archive, Settings } from "lucide-react";
import type { UserProfile } from "@/types/profile";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
} from "@/store/api/profileApi";

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

function normalizeAvatarUrl(value?: string) {
  if (!value) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  const cleanValue = value.replace(/^\/+/, "");
  if (cleanValue.startsWith("images/")) {
    return `https://instagram-api.softclub.tj/${cleanValue}`;
  }

  return `https://instagram-api.softclub.tj/images/${cleanValue}`;
}

function getAvatarUrl(profile: UserProfile) {
  const avatar =
    profile.avatar ||
    profile.image ||
    profile.avatarUrl ||
    profile.imageUrl ||
    "";
  return normalizeAvatarUrl(avatar);
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
    <section className="border-b border-zinc-800 px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto flex max-w-4xl gap-8 sm:gap-14">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-zinc-900 sm:h-36 sm:w-36" />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="h-8 w-44 animate-pulse rounded bg-zinc-900" />
          <div className="grid max-w-md grid-cols-2 gap-2">
            <div className="h-8 animate-pulse rounded-lg bg-zinc-900" />
            <div className="h-8 animate-pulse rounded-lg bg-zinc-900" />
          </div>
          <div className="flex gap-8">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-900" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-900" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-900" />
          </div>
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-zinc-900" />
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
  const [showSettings, setShowSettings] = useState(false);
  const dispatch = useDispatch();
  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();

  const handleLogout = () => {
    dispatch(logout());
    setShowSettings(false);
  };

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profile) {
    return null;
  }

  const handleFollow = async () => {
    if (!profile || !profile.id) return;
    try {
      if (profile.isFollowing) {
        await unfollowUser({ followingUserId: profile.id }).unwrap();
      } else {
        await followUser({ followingUserId: profile.id }).unwrap();
      }
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
    }
  };

  const username = getUsername(profile);
  const displayName = getDisplayName(profile);
  const bio = getBio(profile);
  const avatarUrl = getAvatarUrl(profile);
  const initial = username.charAt(0).toUpperCase();

  return (
    <section className="border-b border-zinc-800 px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-7 sm:flex-row sm:items-start sm:gap-14">
        <div className="flex justify-center sm:w-40 sm:justify-start lg:w-52">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 bg-cover bg-center text-4xl font-semibold text-zinc-500 sm:h-36 sm:w-36 lg:h-40 lg:w-40"
            style={
              avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined
            }
            aria-label={`${username} avatar`}
          >
            {!avatarUrl && initial}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <h1 className="min-w-0 truncate text-xl font-normal text-white sm:text-2xl">
              {username}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {profile.isMyProfile ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-[#363636] hover:bg-[#262626] px-4 text-sm font-semibold text-white transition duration-200"
                  >
                    Редактировать профиль
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#363636] hover:bg-[#262626] px-4 text-sm font-semibold text-white transition duration-200"
                  >
                    <Archive className="h-4 w-4" />
                    Посмотреть архив
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                    aria-label="Настройки профиля"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={isFollowingLoading || isUnfollowingLoading}
                  className={`inline-flex h-8 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    profile.isFollowing
                      ? "bg-[#363636] hover:bg-[#262626]"
                      : "bg-sky-500 hover:bg-sky-400"
                  }`}
                >
                  {profile.isFollowing ? "Отписаться" : "Подписаться"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-y border-zinc-900 py-3 text-center text-sm sm:flex sm:border-y-0 sm:py-0 sm:text-left">
            <span>
              <strong className="font-semibold text-white">
                {formatCount(getPostsCount(profile))}
              </strong>{" "}
              <span className="text-zinc-300">публикаций</span>
            </span>
            <span>
              <strong className="font-semibold text-white">
                {formatCount(getFollowersCount(profile))}
              </strong>{" "}
              <span className="text-zinc-300">подписчиков</span>
            </span>
            <span>
              <strong className="font-semibold text-white">
                {formatCount(getFollowingCount(profile))}
              </strong>{" "}
              <span className="text-zinc-300">подписок</span>
            </span>
          </div>

          <div className="text-sm leading-5">
            {displayName && (
              <p className="font-semibold text-white">{displayName}</p>
            )}
            {profile.occupation && (
              <p className="text-zinc-500">{profile.occupation}</p>
            )}
            {bio ? (
              <p className="mt-1 whitespace-pre-line text-zinc-200">{bio}</p>
            ) : (
              <p className="mt-1 text-zinc-500">Описание пока не добавлено.</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Options Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-center shadow-2xl">
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              Приложения и сайты
            </button>
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              QR-код
            </button>
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              Уведомления
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                onEdit();
              }}
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition font-semibold"
            >
              Настройки и конфиденциальность
            </button>
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              Meta Verified
            </button>
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              Родительский контроль
            </button>
            <button
              type="button"
              className="w-full border-b border-zinc-900 py-3.5 text-sm text-white hover:bg-zinc-900 transition"
            >
              Входы в аккаунт
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full border-b border-zinc-900 py-3.5 text-sm font-bold text-red-500 hover:bg-zinc-900 transition"
            >
              Выйти
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="w-full py-3.5 text-sm text-zinc-400 hover:bg-zinc-900 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
