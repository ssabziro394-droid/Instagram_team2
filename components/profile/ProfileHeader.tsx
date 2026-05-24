"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { Archive, Settings, X, ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import type { UserProfile } from "@/types/profile";
import {
  useProfileFollowUserMutation,
  useProfileUnfollowUserMutation,
  useGetIsFollowUserProfileByIdQuery,
} from "@/store/api/profileApi";
import { useGetUserStoriesQuery, useGetMyStoriesQuery } from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";

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
  const [showSettings, setShowSettings] = useState(false);
  const dispatch = useDispatch();
  const [followUser, { isLoading: isFollowingLoading }] = useProfileFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useProfileUnfollowUserMutation();

  // Story viewer state
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  // Compute target user ID before any early returns (React rules of hooks)
  const isOwnProfile = !!profile?.isMyProfile;
  const targetUserId = isOwnProfile ? "" : String(profile?.id ?? profile?.userId ?? "");

  // Fetch this profile's stories
  const { data: otherStoriesResponse } = useGetUserStoriesQuery(targetUserId, {
    skip: !targetUserId || isOwnProfile,
  });
  const { data: myStoriesResponse } = useGetMyStoriesQuery(undefined, {
    skip: !isOwnProfile,
  });

  const userStories = isOwnProfile
    ? (myStoriesResponse?.data?.stories ?? [])
    : (otherStoriesResponse?.data?.stories ?? []);
  const hasStories = userStories.length > 0;

  // Auto-progress through stories
  const progressTimer = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (!isStoryOpen) return;
    setStoryProgress(0);
    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setStoryProgress((p) => {
        if (p >= 100) {
          clearInterval(progressTimer.current);
          if (activeStoryIndex < userStories.length - 1) {
            setActiveStoryIndex((i) => i + 1);
          } else {
            setIsStoryOpen(false);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(progressTimer.current);
  }, [isStoryOpen, activeStoryIndex, userStories.length]);

  const handleOpenStory = useCallback(() => {
    if (!hasStories) return;
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsStoryOpen(true);
  }, [hasStories]);

  // Fetch real follow status from API — runs when targetUserId is known
  const { data: isFollowingFromApi, isLoading: isFollowCheckLoading } =
    useGetIsFollowUserProfileByIdQuery(targetUserId, {
      skip: !targetUserId || isOwnProfile,
    });

  // Local optimistic state: undefined = not yet overridden
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | undefined>(undefined);

  // Final follow value: local optimistic → API → false
  const isFollowing = localIsFollowing !== undefined
    ? localIsFollowing
    : (isFollowingFromApi ?? profile?.isFollowing ?? false);

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
    const userId = profile.id ?? profile.userId;
    if (!userId) return;
    if (isFollowCheckLoading) return; // Wait for API check

    const currentlyFollowing = isFollowing;

    // Optimistic update — flip immediately
    setLocalIsFollowing(!currentlyFollowing);

    try {
      if (currentlyFollowing) {
        await unfollowUser({ followingUserId: userId }).unwrap();
      } else {
        await followUser({ followingUserId: userId }).unwrap();
      }
      // After success — reset to let API re-fetch give the truth
      setLocalIsFollowing(undefined);
    } catch (error) {
      // Revert on error
      setLocalIsFollowing(currentlyFollowing);
      console.error("Failed to follow/unfollow user:", error);
    }
  };

  const username = getUsername(profile);
  const displayName = getDisplayName(profile);
  const bio = getBio(profile);
  const avatarUrl = getAvatarUrl(profile);
  const initial = username.charAt(0).toUpperCase();

  return (
    <section className="border-b border-ig-border px-4 py-8 sm:px-8 lg:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-7 sm:flex-row sm:items-start sm:gap-14">
        <div className="flex justify-center sm:w-40 sm:justify-start lg:w-52">
          {/* Avatar with story ring if user has stories */}
          <button
            type="button"
            onClick={hasStories ? handleOpenStory : undefined}
            className={hasStories ? "cursor-pointer" : "cursor-default"}
            aria-label={hasStories ? `View ${username}'s story` : undefined}
          >
            <div
              className={`relative flex items-center justify-center rounded-full ${
                hasStories
                  ? "p-[3px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
                  : ""
              }`}
            >
              <div className={`rounded-full ${hasStories ? "p-[2px] bg-ig-bg" : ""}`}>
                <div
                  className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-ig-border bg-ig-card-bg bg-cover bg-center text-4xl font-semibold text-ig-secondary sm:h-36 sm:w-36 lg:h-40 lg:w-40"
                  style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                  aria-label={`${username} avatar`}
                >
                  {!avatarUrl && initial}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* ── Inline Story Viewer Modal ── */}
        {isStoryOpen && userStories.length > 0 && (() => {
          const story = userStories[activeStoryIndex];
          const mediaUrl = getFileUrl(story?.fileName, "post");
          const isVideo = [".mp4", ".webm", ".mov", ".avi", ".mkv"].some((e) =>
            mediaUrl.toLowerCase().includes(e)
          );
          return (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setIsStoryOpen(false)}
            >
              <div
                className="relative w-full max-w-sm mx-auto h-[90vh] max-h-[700px] bg-black rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress bars */}
                <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
                  {userStories.map((_, i) => (
                    <div key={i} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-none"
                        style={{ width: i < activeStoryIndex ? "100%" : i === activeStoryIndex ? `${storyProgress}%` : "0%" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header */}
                <div className="absolute top-7 left-3 right-3 z-10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40">
                    <img src={avatarUrl || getFileUrl(null, "avatar")} alt={username} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white text-sm font-semibold drop-shadow">{username}</span>
                  <button
                    onClick={() => setIsStoryOpen(false)}
                    className="ml-auto text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Media */}
                <div className="w-full h-full">
                  {isVideo ? (
                    <video src={mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="story" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Prev / Next tap zones */}
                <button
                  className="absolute left-0 top-0 h-full w-1/3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeStoryIndex > 0) { setActiveStoryIndex((i) => i - 1); setStoryProgress(0); }
                    else setIsStoryOpen(false);
                  }}
                />
                <button
                  className="absolute right-0 top-0 h-full w-1/3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeStoryIndex < userStories.length - 1) { setActiveStoryIndex((i) => i + 1); setStoryProgress(0); }
                    else setIsStoryOpen(false);
                  }}
                />
              </div>
            </div>
          );
        })()}

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <h1 className="min-w-0 truncate text-xl font-normal text-ig-fg sm:text-2xl">
              {username}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {profile.isMyProfile ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-ig-sidebar-hover hover:bg-ig-hover px-4 text-sm font-semibold text-ig-fg transition duration-200"
                  >
                    Редактировать профиль
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-ig-sidebar-hover hover:bg-ig-hover px-4 text-sm font-semibold text-ig-fg transition duration-200"
                  >
                    <Archive className="h-4 w-4" />
                    Посмотреть архив
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="rounded-full p-2 text-ig-fg transition hover:bg-ig-hover"
                    aria-label="Настройки профиля"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={isFollowingLoading || isUnfollowingLoading || isFollowCheckLoading}
                  className={`inline-flex h-8 items-center justify-center rounded-lg px-6 text-sm font-semibold transition disabled:opacity-50 ${
                    isFollowing
                      ? "bg-ig-sidebar-hover hover:bg-ig-hover text-ig-fg"
                      : "bg-sky-500 hover:bg-sky-400 text-white"
                  }`}
                >
                  {isFollowCheckLoading
                    ? "..."
                    : isFollowing
                    ? "Отписаться"
                    : "Подписаться"}
                </button>
              )}
            </div>
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
