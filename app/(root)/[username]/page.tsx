"use client";

import axios from "axios";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import CreatePostModalGate from "@/components/create/CreatePostModalGate";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileGrid from "@/components/profile/ProfileGrid";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {
  useGetMyProfileQuery,
  useGetUserProfileByIdQuery,
  useUpdateUserProfileMutation,
} from "@/store/api/profileApi";
import { useGetUsersQuery } from "@/store/api/searchApi";
import { useGetProfilePostsQuery } from "@/store/api/postsApi";
import PostDetailModal from "@/components/profile/PostDetailModal";
import { getUsernameFromToken } from "@/lib/utils";
import type {
  ProfilePost,
  UpdateUserProfileRequest,
  UserProfile,
} from "@/types/profile";

const POSTS_URL = "https://instagram-api.softclub.tj/Post/get-posts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyProfileId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    const id = String(value).trim();
    return id.length > 0 ? id : null;
  }

  return null;
}

function getProfileUserId(profile?: UserProfile | null) {
  return stringifyProfileId(
    profile?.userId ??
      profile?.id ??
      profile?.data?.userId ??
      profile?.data?.id,
  );
}


function unwrapPosts(response: unknown): ProfilePost[] {
  const posts =
    (isRecord(response) &&
      isRecord(response.data) &&
      response.data.items) ||
    (isRecord(response) && response.data) ||
    (isRecord(response) && response.items) ||
    response ||
    [];

  if (Array.isArray(posts)) {
    return posts as ProfilePost[];
  }

  if (isRecord(posts)) {
    for (const key of ["items", "data", "posts", "result", "results"]) {
      const value = posts[key];
      if (Array.isArray(value)) {
        return value as ProfilePost[];
      }
    }
  }

  return [];
}

function getPostsErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return "Вы не авторизованы";
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === 401) {
      return "Вы не авторизованы";
    }
  }

  return "Не удалось загрузить публикации.";
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const usernameParam = params?.username ? String(params.username) : "";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | number | null>(null);

  const myProfileQuery = useGetMyProfileQuery();

  const isOwnProfile = useMemo(() => {
    if (!usernameParam) return true;
    
    const tokenUsername = getUsernameFromToken();
    if (tokenUsername && usernameParam.toLowerCase() === tokenUsername.toLowerCase()) {
      return true;
    }
    
    const ownUsername = myProfileQuery.data?.username ?? myProfileQuery.data?.userName;
    if (!ownUsername) {
      if (myProfileQuery.isLoading || myProfileQuery.isUninitialized) {
        return true;
      }
      return false;
    }
    
    return usernameParam.toLowerCase() === ownUsername.toLowerCase();
  }, [usernameParam, myProfileQuery.data, myProfileQuery.isLoading, myProfileQuery.isUninitialized]);

  const shouldSearch = !isOwnProfile && !!usernameParam;
  const searchUsersQuery = useGetUsersQuery(
    usernameParam,
    { skip: !shouldSearch }
  );

  const targetUser = useMemo(() => {
    if (!searchUsersQuery.data || !usernameParam) return null;
    return searchUsersQuery.data.find(
      (u) =>
        (u.username ?? u.userName ?? "").toLowerCase() === usernameParam.toLowerCase()
    ) ?? searchUsersQuery.data[0];
  }, [searchUsersQuery.data, usernameParam]);

  const targetUserId = targetUser?.id ?? targetUser?.userId;

  const targetProfileQuery = useGetUserProfileByIdQuery(
    targetUserId ?? "",
    { skip: !targetUserId || isOwnProfile }
  );

  const activeProfile = isOwnProfile ? myProfileQuery.data : targetProfileQuery.data;
  const isProfileLoading = isOwnProfile
    ? myProfileQuery.isLoading || myProfileQuery.isFetching
    : myProfileQuery.isLoading || myProfileQuery.isFetching || searchUsersQuery.isLoading || targetProfileQuery.isLoading || targetProfileQuery.isFetching;

  const isProfileError = isOwnProfile
    ? myProfileQuery.isError
    : myProfileQuery.isError || (searchUsersQuery.isSuccess && !targetUser) || targetProfileQuery.isError;

  const currentUserId = getProfileUserId(activeProfile);
  const [updateUserProfile, updateState] = useUpdateUserProfileMutation();

  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsErrorQuery,
    error: postsErrorQuery,
    refetch: refetchPosts,
  } = useGetProfilePostsQuery(
    { userId: currentUserId },
    { skip: !currentUserId }
  );

  const posts = postsData ?? [];
  const postsError = postsErrorQuery ? "Не удалось загрузить публикации." : null;
  const isPostsError = isPostsErrorQuery;
  const hasLoadedPosts = !isPostsLoading && postsData !== undefined;

  const activePost = useMemo(() => {
    if (selectedPostId === null) return null;
    return posts.find(
      (p) => String(p.postId) === String(selectedPostId) || String(p.id) === String(selectedPostId)
    );
  }, [posts, selectedPostId]);

  useEffect(() => {
    if (activeProfile) {
      console.log("profile:", activeProfile);
    }
  }, [activeProfile]);

  const profileWithPostCount = useMemo(() => {
    if (!activeProfile) {
      return null;
    }

    if (!hasLoadedPosts) {
      return activeProfile;
    }

    const postsCount = posts.length;
    return {
      ...activeProfile,
      isMyProfile: isOwnProfile,
      postsCount,
      postCount: postsCount,
    };
  }, [hasLoadedPosts, posts.length, activeProfile, isOwnProfile]);

  const handleRetry = useCallback(() => {
    void myProfileQuery.refetch();
    if (!isOwnProfile && targetUserId) {
      void targetProfileQuery.refetch();
    }
    if (currentUserId) {
      void refetchPosts();
    }
  }, [refetchPosts, myProfileQuery, targetProfileQuery, isOwnProfile, targetUserId, currentUserId]);

  const handleOpenCreatePost = useCallback(() => {
    const params =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search);

    params.set("create", "true");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router]);

  const handlePostCreated = useCallback(() => {
    void myProfileQuery.refetch();
    if (!isOwnProfile && targetUserId) {
      void targetProfileQuery.refetch();
    }
    if (currentUserId) {
      void refetchPosts();
    }
  }, [refetchPosts, myProfileQuery, targetProfileQuery, isOwnProfile, targetUserId, currentUserId]);

  const handleSaveProfile = useCallback(
    async (values: UpdateUserProfileRequest) => {
      setActionError("");

      try {
        await updateUserProfile(values).unwrap();
        setIsEditOpen(false);
        void myProfileQuery.refetch();
      } catch {
        setActionError("Не удалось сохранить изменения профиля.");
      }
    },
    [myProfileQuery, updateUserProfile],
  );

  if (isProfileError) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-ig-secondary" />
        <div>
          <h1 className="text-xl font-semibold text-ig-fg">
            Не удалось загрузить профиль
          </h1>
          <p className="mt-2 text-sm text-ig-secondary">
            Данные профиля временно недоступны.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-ig-sidebar-hover px-4 py-2 text-sm font-medium text-ig-fg transition hover:bg-zinc-700"
        >
          <RefreshCw className="h-4 w-4" />
          Попробовать снова
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-full bg-ig-bg text-ig-fg">
      <Suspense fallback={null}>
        <CreatePostModalGate onPostCreated={handlePostCreated} />
      </Suspense>
      <ProfileHeader
        profile={profileWithPostCount}
        isLoading={isProfileLoading}
        onEdit={() => setIsEditOpen(true)}
      />

      {actionError && (
        <div className="mx-auto max-w-4xl px-4 pt-4 text-sm text-red-400 sm:px-8">
          {actionError}
        </div>
      )}

      <ProfileGrid
        posts={posts}
        isLoading={
          isProfileLoading ||
          isPostsLoading ||
          (currentUserId !== null && !hasLoadedPosts)
        }
        isError={isPostsError}
        errorMessage={postsError ?? "Не удалось загрузить публикации."}
        onCreatePost={handleOpenCreatePost}
        onPostClick={(post) => {
          setSelectedPostId(post.postId ?? post.id ?? null);
        }}
      />

      {isEditOpen && myProfileQuery.data && (
        <EditProfileModal
          profile={myProfileQuery.data}
          isSaving={updateState.isLoading}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {activePost && (
        <PostDetailModal
          post={activePost}
          currentUser={myProfileQuery.data}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
