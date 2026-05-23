import { baseApi } from "./baseApi";
import { Reel } from "@/components/reels/types";

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * URL-encodes individual path segments to safely handle spaces, Cyrillic
 * characters, and '#' symbols that appear inside file-path segments.
 * Only '?' separates the path from the query string; '#' is treated as part
 * of the path (per the backend convention).
 */
const encodeUrlPath = (fullUrl: string): string => {
  if (!fullUrl) return "";

  let protocolAndDomain = "";
  let pathAndQuery = fullUrl;

  if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
    const domainStartIndex = fullUrl.indexOf("://") + 3;
    const pathStartIndex = fullUrl.indexOf("/", domainStartIndex);

    if (pathStartIndex === -1) return fullUrl;

    protocolAndDomain = fullUrl.substring(0, pathStartIndex);
    pathAndQuery = fullUrl.substring(pathStartIndex);
  }

  let queryStr = "";
  let pathOnly = pathAndQuery;
  const queryIndex = pathAndQuery.indexOf("?");

  if (queryIndex !== -1) {
    pathOnly = pathAndQuery.substring(0, queryIndex);
    queryStr = pathAndQuery.substring(queryIndex);
  }

  const encodedSegments = pathOnly.split("/").map((segment) => {
    if (!segment) return "";
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  });

  return `${protocolAndDomain}${encodedSegments.join("/")}${queryStr}`;
};

/**
 * Resolves and cleans relative or absolute asset URLs (images / videos).
 * Falls back to a DiceBear avatar when the URL is empty and a username seed
 * is provided.
 */
const resolveAssetUrl = (rawUrl: string, usernameFallback?: string): string => {
  if (!rawUrl) {
    return usernameFallback
      ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${usernameFallback}`
      : "";
  }

  let url = rawUrl.includes("uploads")
    ? rawUrl.replace("uploads", "images")
    : rawUrl;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return encodeUrlPath(url);
  }

  if (!url.startsWith("images/") && !url.startsWith("/images/")) {
    url = url.startsWith("/") ? `/images${url}` : `/images/${url}`;
  } else if (!url.startsWith("/")) {
    url = `/${url}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-api.softclub.tj";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return encodeUrlPath(`${cleanBase}${url}`);
};

// ---------------------------------------------------------------------------
// Generic helper to extract an array from various response shapes
// ---------------------------------------------------------------------------

function extractArray(response: unknown): unknown[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === "object" && response !== null) {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
    if (arrayKey) return obj[arrayKey] as unknown[];
  }
  return [];
}

// ---------------------------------------------------------------------------
// API slice
// ---------------------------------------------------------------------------

export const reelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Reels ────────────────────────────────────────────────────────────────

    getPlayableReels: builder.query<
      Reel[],
      { pageNumber?: number; pageSize?: number } | void
    >({
      query: (params) => ({
        url: `/Post/get-reels`,
        params: {
          PageNumber: params?.pageNumber ?? 1,
          PageSize: params?.pageSize ?? 10,
        },
      }),
      transformResponse: (response: unknown): Reel[] =>
        extractArray(response).map((item: any, index) => {
          const rawVideo =
            item.videoUrl ?? item.video ?? item.images ??
            item.image ?? item.url ?? item.file ?? item.videoPath ?? "";

          const username =
            item.userName ?? item.username ?? item.creatorName ??
            item.creator?.username ?? item.creator?.userName ??
            `user_${item.postId ?? item.id ?? index}`;

          const rawAvatar =
            item.userImage ?? item.userAvatar ?? item.avatar ??
            item.avatarUrl ?? item.creator?.avatarUrl ?? item.creator?.avatar ?? "";

          return {
            id: String(item.postId ?? item.id ?? `reel-${index}`),
            videoUrl: resolveAssetUrl(rawVideo),
            creator: {
              id: String(item.creatorId ?? item.userId ?? index),
              username,
              avatarUrl: resolveAssetUrl(rawAvatar, username),
              isFollowing: !!(item.isFollowing ?? item.creator?.isFollowing ?? false),
            },
            caption:
              item.caption ?? item.title ?? item.content ??
              item.description ?? "No caption provided",
            audioName:
              item.audioName ?? item.audio ?? `@${username} original audio`,
            likesCount: Number(
              item.postLikeCount ?? item.likesCount ?? item.likes ?? item.likeCount ?? 0
            ),
            commentsCount: Number(
              item.commentCount ?? item.commentsCount ?? item.comments ?? 0
            ),
            isLiked: !!(item.postLike ?? item.isLiked ?? false),
            isSaved: !!(item.postFavorite ?? item.isSaved ?? false),
          } satisfies Reel;
        }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Reel" as const, id })),
              { type: "Reel", id: "LIST" },
            ]
          : [{ type: "Reel", id: "LIST" }],
    }),

    // ── Users ────────────────────────────────────────────────────────────────

    getUsers: builder.query<
      { id: string; username: string; avatarUrl: string }[],
      { pageNumber?: number; pageSize?: number } | void
    >({
      query: (params) => ({
        url: `/User/get-users`,
        params: {
          PageNumber: params?.pageNumber ?? 1,
          PageSize: params?.pageSize ?? 30,
        },
      }),
      transformResponse: (response: unknown) =>
        extractArray(response).map((item: any, index) => {
          const username = String(
            item.userName ?? item.username ?? item.name ??
            item.fullName ?? `user_${index}`
          );
          const rawAvatar =
            item.avatar ?? item.userAvatar ?? item.avatarUrl ??
            item.image ?? item.imageUrl ?? "";

          return {
            id: String(item.userId ?? item.id ?? `user-${index}`),
            username,
            avatarUrl: resolveAssetUrl(rawAvatar, username),
          };
        }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    // ── Single post ──────────────────────────────────────────────────────────

    /**
     * Fetches a single post / reel by ID.
     * Returns `null` when the backend signals an error or the payload is malformed.
     */
    getPostById: builder.query<Reel | null, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/get-post-by-id`,
        params: { postId },
      }),
      transformResponse: (response: any): Reel | null => {
        if (!response) return null;

        if (
          response.statusCode >= 400 ||
          (Array.isArray(response.errors) && response.errors.length > 0)
        ) {
          return null;
        }

        const item = response.data !== undefined ? response.data : response;
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;

        const rawId = item.postId ?? item.id;
        if (rawId === undefined || rawId === null) return null;
        const id = String(rawId);

        const rawVideo =
          item.videoUrl ?? item.video ?? item.images ??
          item.image ?? item.url ?? item.file ?? item.videoPath ?? "";

        const username =
          item.userName ?? item.username ?? item.creatorName ??
          item.creator?.username ?? item.creator?.userName ?? `user_${id}`;

        const rawAvatar =
          item.userImage ?? item.userAvatar ?? item.avatar ??
          item.avatarUrl ?? item.creator?.avatarUrl ?? item.creator?.avatar ?? "";

        const rawComments =
          item.comments ?? item.postComments ?? item.commentList ?? [];

        const comments = Array.isArray(rawComments)
          ? rawComments.map((c: any) => ({
              id: String(c.commentId ?? c.id ?? Math.random()),
              username: c.userName ?? c.username ?? "user",
              avatarUrl: resolveAssetUrl(
                c.userImage ?? c.avatar ?? c.avatarUrl ?? "",
                c.userName ?? c.username
              ),
              text: c.commentText ?? c.text ?? "",
              timestamp: c.dateCreated ?? c.createdAt ?? "1s",
              likesCount: Number(c.likesCount ?? 0),
            }))
          : [];

        return {
          id,
          videoUrl: resolveAssetUrl(rawVideo),
          creator: {
            id: String(item.creatorId ?? item.userId ?? ""),
            username,
            avatarUrl: resolveAssetUrl(rawAvatar, username),
            isFollowing: !!(item.isFollowing ?? item.creator?.isFollowing ?? false),
          },
          caption:
            item.caption ?? item.title ?? item.content ??
            item.description ?? "No caption provided",
          audioName: item.audioName ?? item.audio ?? `@${username} original audio`,
          likesCount: Number(
            item.postLikeCount ?? item.likesCount ?? item.likes ?? item.likeCount ?? 0
          ),
          commentsCount: Number(
            item.commentCount ?? item.commentsCount ?? item.comments ?? 0
          ),
          isLiked: !!(item.postLike ?? item.isLiked ?? false),
          isSaved: !!(item.postFavorite ?? item.isSaved ?? false),
          comments,
        };
      },
      providesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
      ],
    }),

    // ── Mutations ────────────────────────────────────────────────────────────

    likePost: builder.mutation<unknown, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/like-post`,
        method: "POST",
        params: { postId: Number(postId) },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
        { type: "Reel", id: "LIST" },
      ],
    }),

    addComment: builder.mutation<
      unknown,
      { postId: string | number; commentText: string }
    >({
      query: ({ postId, commentText }) => ({
        url: `/Post/add-comment`,
        method: "POST",
        body: { postId: Number(postId), comment: commentText },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
        { type: "Reel", id: "LIST" },
      ],
    }),

    deleteComment: builder.mutation<
      unknown,
      { commentId: string | number; postId?: string | number }
    >({
      query: ({ commentId }) => ({
        url: `/Post/delete-comment`,
        method: "DELETE",
        params: { commentId: Number(commentId) },
      }),
      invalidatesTags: (result, error, arg) => {
        const tags: { type: "Reel"; id: string }[] = [
          { type: "Reel", id: "LIST" },
        ];
        if (arg.postId) {
          tags.push({ type: "Reel", id: String(arg.postId) });
        }
        return tags;
      },
    }),

    addPostFavorite: builder.mutation<unknown, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/add-post-favorite`,
        method: "POST",
        body: { postId: Number(postId) },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
        { type: "Reel", id: "LIST" },
      ],
    }),

    viewPost: builder.mutation<unknown, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/view-post`,
        method: "POST",
        params: { postId: Number(postId) },
      }),
    }),
  }),
  overrideExisting: false,
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const {
  useGetPlayableReelsQuery,
  useGetUsersQuery,
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useViewPostMutation,
} = reelsApi;

// Backward-compatible alias used by branch `ismoil`
export const useGetReelsQuery = useGetPlayableReelsQuery;