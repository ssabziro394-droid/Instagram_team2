"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { Archive, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/profile";
import {
  useProfileFollowUserMutation,
  useProfileUnfollowUserMutation,
  useGetIsFollowUserProfileByIdQuery,
  useProfileGetSubscribersQuery,
  useProfileGetSubscriptionsQuery,
} from "@/store/api/profileApi";

type ProfileHeaderProps = {
  profile: UserProfile | null;
  isLoading?: boolean;
  onEdit: () => void;
};

function getDisplayName(profile: UserProfile | null | undefined) {
  if (!profile) return "";
  return (
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  );
}

function getUsername(profile: UserProfile | null | undefined) {
  return profile?.username || profile?.userName || "Профиль";
}

function getBio(profile: UserProfile | null | undefined) {
  return profile?.bio || profile?.about || "";
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

function getAvatarUrl(profile: UserProfile | null | undefined) {
  if (!profile) return "";
  const avatar =
    profile.avatar ||
    profile.image ||
    profile.avatarUrl ||
    profile.imageUrl ||
    "";
  return normalizeAvatarUrl(avatar);
}

function getPostsCount(profile: UserProfile | null | undefined) {
  return profile?.postsCount ?? profile?.postCount ?? 0;
}

function getFollowersCount(profile: UserProfile | null | undefined) {
  return profile?.followersCount ?? profile?.subscribersCount ?? 0;
}

function getFollowingCount(profile: UserProfile | null | undefined) {
  return profile?.followingCount ?? profile?.subscriptionsCount ?? 0;
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
  const router = useRouter();
  const [showUsersModal, setShowUsersModal] = useState<{
    type: "subscribers" | "subscriptions";
    title: string;
  } | null>(null);

  const profileUserId = String(profile?.id ?? profile?.userId ?? "");

  const { data: subscribersList, isLoading: isSubscribersLoading } = useProfileGetSubscribersQuery(
    profileUserId,
    { skip: showUsersModal?.type !== "subscribers" || !profileUserId }
  );

  const { data: subscriptionsList, isLoading: isSubscriptionsLoading } = useProfileGetSubscriptionsQuery(
    profileUserId,
    { skip: showUsersModal?.type !== "subscriptions" || !profileUserId }
  );
  const [followUser, { isLoading: isFollowingLoading }] = useProfileFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useProfileUnfollowUserMutation();

  // Compute target user ID before any early returns (React rules of hooks)
  const isOwnProfile = !!profile?.isMyProfile;
  const targetUserId = isOwnProfile ? "" : String(profile?.id ?? profile?.userId ?? "");

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

  const baseFollowersCount = getFollowersCount(profile);
  
  // Calculate optimistic followers count offset
  let followersOffset = 0;
  if (localIsFollowing !== undefined) {
    const originalFollowing = isFollowingFromApi ?? profile?.isFollowing ?? false;
    if (localIsFollowing && !originalFollowing) {
      followersOffset = 1;
    } else if (!localIsFollowing && originalFollowing) {
      followersOffset = -1;
    }
  }
  const followersCount = Math.max(0, baseFollowersCount + followersOffset);

  useEffect(() => {
    if (localIsFollowing !== undefined && isFollowingFromApi === localIsFollowing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalIsFollowing(undefined);
    }
  }, [isFollowingFromApi, localIsFollowing]);

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
    if (isFollowingLoading || isUnfollowingLoading || isFollowCheckLoading) return;

    const currentlyFollowing = isFollowing;

    // Optimistic update — flip immediately
    setLocalIsFollowing(!currentlyFollowing);

    try {
      if (currentlyFollowing) {
        await unfollowUser({ followingUserId: userId }).unwrap();
      } else {
        await followUser({ followingUserId: userId }).unwrap();
      }
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
            <button
              type="button"
              onClick={() => setShowUsersModal({ type: "subscribers", title: "Подписчики" })}
              className="hover:opacity-75 transition cursor-pointer text-center sm:text-left"
              style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit" }}
            >
              <strong className="font-semibold text-ig-fg">
                {formatCount(followersCount)}
              </strong>{" "}
              <span className="text-ig-fg">подписчиков</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUsersModal({ type: "subscriptions", title: "Подписки" })}
              className="hover:opacity-75 transition cursor-pointer text-center sm:text-left"
              style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit" }}
            >
              <strong className="font-semibold text-ig-fg">
                {formatCount(getFollowingCount(profile))}
              </strong>{" "}
              <span className="text-ig-fg">подписок</span>
            </button>
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
      {/* Subscribers / Subscriptions Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            {/* Header */}
            <div className="relative flex items-center justify-center border-b border-zinc-900 py-3.5">
              <h2 className="text-base font-semibold">{showUsersModal.title}</h2>
              <button
                type="button"
                onClick={() => setShowUsersModal(null)}
                className="absolute right-4 text-zinc-400 hover:text-white transition animate-none cursor-pointer"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="max-h-96 min-h-[200px] overflow-y-auto p-4 flex flex-col gap-4">
              {showUsersModal.type === "subscribers" ? (
                isSubscribersLoading ? (
                  <div className="flex flex-1 items-center justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                  </div>
                ) : !subscribersList || subscribersList.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-10 text-zinc-400 text-sm">
                    Нет подписчиков
                  </div>
                ) : (
                  subscribersList.map((u, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const userInfo = (u as unknown as Record<string, any>).userShortInfo ?? u;
                    const uUsername = userInfo.username ?? userInfo.userName ?? "Профиль";
                    const uDisplayName = userInfo.fullName ?? userInfo.fullname ?? [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ") ?? "";
                    const uAvatar = normalizeAvatarUrl(userInfo.userPhoto ?? userInfo.avatar ?? userInfo.image ?? userInfo.avatarUrl ?? userInfo.imageUrl);
                    const uInitial = uUsername.charAt(0).toUpperCase();
                    const uId = userInfo.userId ?? userInfo.id ?? "";

                    return (
                      <div
                        key={String(uId || index)}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                        onClick={() => {
                          setShowUsersModal(null);
                          router.push(`/${encodeURIComponent(uUsername)}?id=${encodeURIComponent(String(uId))}`);
                        }}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ig-border bg-ig-card-bg bg-cover bg-center text-lg font-semibold text-ig-secondary"
                          style={uAvatar ? { backgroundImage: `url(${uAvatar})` } : undefined}
                        >
                          {!uAvatar && uInitial}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-ig-fg truncate hover:underline">
                            {uUsername}
                          </span>
                          {uDisplayName && (
                            <span className="text-xs text-ig-secondary truncate">
                              {uDisplayName}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              ) : isSubscriptionsLoading ? (
                <div className="flex flex-1 items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                </div>
              ) : !subscriptionsList || subscriptionsList.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-10 text-zinc-400 text-sm">
                  Нет подписок
                </div>
              ) : (
                subscriptionsList.map((u, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const userInfo = (u as unknown as Record<string, any>).userShortInfo ?? u;
                  const uUsername = userInfo.username ?? userInfo.userName ?? "Профиль";
                  const uDisplayName = userInfo.fullName ?? userInfo.fullname ?? [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ") ?? "";
                  const uAvatar = normalizeAvatarUrl(userInfo.userPhoto ?? userInfo.avatar ?? userInfo.image ?? userInfo.avatarUrl ?? userInfo.imageUrl);
                  const uInitial = uUsername.charAt(0).toUpperCase();
                  const uId = userInfo.userId ?? userInfo.id ?? "";

                  return (
                    <div
                      key={String(uId || index)}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                      onClick={() => {
                        setShowUsersModal(null);
                        router.push(`/${encodeURIComponent(uUsername)}?id=${encodeURIComponent(String(uId))}`);
                      }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ig-border bg-ig-card-bg bg-cover bg-center text-lg font-semibold text-ig-secondary"
                        style={uAvatar ? { backgroundImage: `url(${uAvatar})` } : undefined}
                      >
                        {!uAvatar && uInitial}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-ig-fg truncate hover:underline">
                          {uUsername}
                        </span>
                        {uDisplayName && (
                          <span className="text-xs text-ig-secondary truncate">
                            {uDisplayName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
