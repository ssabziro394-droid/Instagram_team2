import { baseApi } from "./baseApi";
import { Reel } from "@/components/reels/types";

// Helper to URL-encode individual path segments safely (preventing issues with spaces, Cyrillic, and # hash)
const encodeUrlPath = (fullUrl: string): string => {
  if (!fullUrl) return "";
  
  // Separate protocol and domain if absolute
  let protocolAndDomain = "";
  let pathAndQuery = fullUrl;
  
  if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
    const doubleSlashIndex = fullUrl.indexOf("://");
    const domainStartIndex = doubleSlashIndex + 3;
    const pathStartIndex = fullUrl.indexOf("/", domainStartIndex);
    
    if (pathStartIndex !== -1) {
      protocolAndDomain = fullUrl.substring(0, pathStartIndex);
      pathAndQuery = fullUrl.substring(pathStartIndex);
    } else {
      return fullUrl;
    }
  }
  
  // Separate query parameters or hash fragment if any (but we do want to encode '#' in path filenames!)
  // In the case of instagram-api.softclub.tj/images/#Real%20Madrid%20Football, the '#' is part of the actual file path.
  // Thus we only split at '?' for queries.
  let queryStr = "";
  let pathOnly = pathAndQuery;
  const queryIndex = pathAndQuery.indexOf("?");
  
  if (queryIndex !== -1) {
    pathOnly = pathAndQuery.substring(0, queryIndex);
    queryStr = pathAndQuery.substring(queryIndex);
  }
  
  const segments = pathOnly.split("/");
  const encodedSegments = segments.map((segment) => {
    if (!segment) return "";
    try {
      // Decode first to prevent double-encoding already escaped spaces or characters
      const decoded = decodeURIComponent(segment);
      return encodeURIComponent(decoded);
    } catch {
      return encodeURIComponent(segment);
    }
  });
  
  return `${protocolAndDomain}${encodedSegments.join("/")}${queryStr}`;
};

// Helper to resolve and clean relative or absolute asset URLs (images/videos)
const resolveAssetUrl = (rawUrl: string, usernameFallback?: string): string => {
  if (!rawUrl) {
    if (usernameFallback) {
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${usernameFallback}`;
    }
    return "";
  }

  let url = rawUrl;

  // Clean 'uploads' to 'images' in the relative or absolute path
  if (url.includes("uploads")) {
    url = url.replace("uploads", "images");
  }

  // Handle absolute URL resolving
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return encodeUrlPath(url);
  }

  // Ensure relative path has the '/images/' prefix if it doesn't already
  if (!url.startsWith("images/") && !url.startsWith("/images/")) {
    url = url.startsWith("/") ? `/images${url}` : `/images/${url}`;
  } else {
    url = url.startsWith("/") ? url : `/${url}`;
  }

  // Resolve against active API Base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  
  const absoluteUrl = `${cleanBase}${url}`;
  return encodeUrlPath(absoluteUrl);
};

export const reelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReels: builder.query<Reel[], { pageNumber?: number; pageSize?: number } | void>({
      query: (params) => {
        const pageNumber = params?.pageNumber ?? 1;
        const pageSize = params?.pageSize ?? 10;
        return {
          url: `/Post/get-reels`,
          params: {
            PageNumber: pageNumber,
            PageSize: pageSize,
          },
        };
      },
      // Ensure we safely map the properties returned from the Swagger API to our Reel interface
      transformResponse: (response: any): Reel[] => {
        if (!response) return [];

        // Swagger response might wrap data in a 'data' array or a list field, or return a list directly
        let rawItems: any[] = [];
        if (Array.isArray(response)) {
          rawItems = response;
        } else if (response && Array.isArray(response.data)) {
          rawItems = response.data;
        } else if (response && typeof response === "object") {
          // Look for any array property if not matching 'data'
          const arrayKey = Object.keys(response).find((key) => Array.isArray(response[key]));
          if (arrayKey) {
            rawItems = response[arrayKey];
          }
        }

        return rawItems.map((item: any, index: number) => {
          // Safely resolve the video URL (use images/image/video; exclude content/caption text)
          const rawVideo =
            item.videoUrl ||
            item.video ||
            item.images || // Swagger API uses 'images' key for the media file path
            item.image || 
            item.url ||
            item.file ||
            item.videoPath ||
            "";

          const videoUrl = resolveAssetUrl(rawVideo);

          // Safely resolve user info
          const username =
            item.userName ||
            item.username ||
            item.creatorName ||
            (item.creator && (item.creator.username || item.creator.userName)) ||
            `user_${item.postId || item.id || index}`;

          const rawAvatar =
            item.userImage || // Swagger API uses 'userImage' for creator avatar path
            item.userAvatar ||
            item.avatar ||
            item.avatarUrl ||
            (item.creator && (item.creator.avatarUrl || item.creator.avatar)) ||
            "";

          const avatarUrl = resolveAssetUrl(rawAvatar, username);

          // Safely resolve counts
          const likesCount = Number(item.postLikeCount ?? item.likesCount ?? item.likes ?? item.likeCount ?? 0);
          const commentsCount = Number(item.commentCount ?? item.commentsCount ?? item.comments ?? item.commentCount ?? 0);

          // Safely resolve caption/content
          const caption =
            item.caption ||
            item.title ||
            item.content ||
            item.description ||
            "No caption provided";

          const id = String(item.postId || item.id || `reel-${index}`);

          return {
            id,
            videoUrl,
            creator: {
              id: item.creatorId || item.userId || String(index),
              username,
              avatarUrl,
              isFollowing: !!(item.isFollowing ?? item.creator?.isFollowing ?? false),
            },
            caption,
            audioName: item.audioName || item.audio || `@${username} original audio`,
            likesCount,
            commentsCount,
            isLiked: !!(item.postLike ?? item.isLiked ?? false),
            isSaved: !!(item.postFavorite ?? item.isSaved ?? false),
          };
        });
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Reel" as const, id })),
              { type: "Reel", id: "LIST" },
            ]
          : [{ type: "Reel", id: "LIST" }],
    }),
    getUsers: builder.query<any[], { pageNumber?: number; pageSize?: number } | void>({
      query: (params) => {
        const pageNumber = params?.pageNumber ?? 1;
        const pageSize = params?.pageSize ?? 30;
        return {
          url: `/User/get-users`,
          params: {
            PageNumber: pageNumber,
            PageSize: pageSize,
          },
        };
      },
      transformResponse: (response: any): any[] => {
        if (!response) return [];

        let rawItems: any[] = [];
        if (Array.isArray(response)) {
          rawItems = response;
        } else if (response && Array.isArray(response.data)) {
          rawItems = response.data;
        } else if (response && typeof response === "object") {
          const arrayKey = Object.keys(response).find((key) => Array.isArray(response[key]));
          if (arrayKey) {
            rawItems = response[arrayKey];
          }
        }

        return rawItems.map((item: any, index: number) => {
          const id = String(item.userId || item.id || `user-${index}`);
          const username = String(
            item.userName ||
            item.username ||
            item.name ||
            item.fullName ||
            `user_${index}`
          );

          const rawAvatar =
            item.avatar ||
            item.userAvatar ||
            item.avatarUrl ||
            item.image ||
            item.imageUrl ||
            "";

          const avatarUrl = resolveAssetUrl(rawAvatar, username);

          return {
            id,
            username,
            avatarUrl,
          };
        });
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    /**
     * getPostById: Fetches a single post/reel's detailed information by its ID.
     * Contains validation logic to check for backend success, safely parses assets URLs,
     * and maps comments list into a unified standard interface.
     */
    getPostById: builder.query<Reel | null, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/get-post-by-id`,
        params: { postId },
      }),
      transformResponse: (response: any): Reel | null => {
        if (!response) return null;

        // Validation 1: If the response envelope declares an error, skip parsing.
        // This ensures the application falls back gracefully to grid data on error.
        if (
          response.statusCode >= 400 ||
          (response.errors && response.errors.length > 0)
        ) {
          return null;
        }

        // Validation 2: Ensure data field is defined and matches an object format.
        const item = response.data !== undefined ? response.data : response;
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;

        // Validation 3: Ensure the post has a valid numeric ID to prevent undefined references.
        const rawId = item.postId || item.id;
        if (rawId === undefined || rawId === null) {
          return null;
        }
        const id = String(rawId);

        // Resolve media URLs using reels resolution helper (maps relative upload paths to /images)
        const rawVideo =
          item.videoUrl ||
          item.video ||
          item.images ||
          item.image ||
          item.url ||
          item.file ||
          item.videoPath ||
          "";
        const videoUrl = resolveAssetUrl(rawVideo);

        // Resolve creator details
        const username =
          item.userName ||
          item.username ||
          item.creatorName ||
          (item.creator && (item.creator.username || item.creator.userName)) ||
          `user_${id}`;

        const rawAvatar =
          item.userImage ||
          item.userAvatar ||
          item.avatar ||
          item.avatarUrl ||
          (item.creator && (item.creator.avatarUrl || item.creator.avatar)) ||
          "";
        const avatarUrl = resolveAssetUrl(rawAvatar, username);

        // Resolve counts
        const likesCount = Number(item.postLikeCount ?? item.likesCount ?? item.likes ?? item.likeCount ?? 0);
        const commentsCount = Number(item.commentCount ?? item.commentsCount ?? item.comments ?? item.commentCount ?? 0);

        const caption =
          item.caption ||
          item.title ||
          item.content ||
          item.description ||
          "No caption provided";

        // Map comments returned from backend into unified Comment schema
        const rawComments = item.comments || item.postComments || item.commentList || [];
        const comments = Array.isArray(rawComments)
          ? rawComments.map((c: any) => ({
              id: String(c.commentId || c.id || Math.random()),
              username: c.userName || c.username || "user",
              avatarUrl: resolveAssetUrl(c.userImage || c.avatar || c.avatarUrl || "", c.userName || c.username),
              text: c.commentText || c.text || "",
              timestamp: c.dateCreated || c.createdAt || "1s",
              likesCount: Number(c.likesCount || 0),
            }))
          : [];

        return {
          id,
          videoUrl,
          creator: {
            id: item.creatorId || item.userId || "",
            username,
            avatarUrl,
            isFollowing: !!(item.isFollowing ?? item.creator?.isFollowing ?? false),
          },
          caption,
          audioName: item.audioName || item.audio || `@${username} original audio`,
          likesCount,
          commentsCount,
          isLiked: !!(item.postLike ?? item.isLiked ?? false),
          isSaved: !!(item.postFavorite ?? item.isSaved ?? false),
          comments,
        };
      },
      providesTags: (result, error, arg) => [{ type: "Reel", id: String(arg.postId) }],
    }),
    /**
     * likePost: Likes or unlikes a post.
     * Invalidates the active Reel tag to trigger reactive UI updates.
     */
    likePost: builder.mutation<any, { postId: string | number }>({
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
    /**
     * addComment: Submits a comment string to a specific post.
     */
    addComment: builder.mutation<any, { postId: string | number; commentText: string }>({
      query: ({ postId, commentText }) => ({
        url: `/Post/add-comment`,
        method: "POST",
        body: {
          postId: Number(postId),
          comment: commentText,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
        { type: "Reel", id: "LIST" },
      ],
    }),
    /**
     * deleteComment: Removes an authored comment.
     */
    deleteComment: builder.mutation<any, { commentId: string | number; postId?: string | number }>({
      query: ({ commentId }) => ({
        url: `/Post/delete-comment`,
        method: "DELETE",
        params: { commentId: Number(commentId) },
      }),
      invalidatesTags: (result, error, arg) => {
        const tags: any[] = [];
        if (arg.postId) {
          tags.push({ type: "Reel", id: String(arg.postId) });
        }
        tags.push({ type: "Reel", id: "LIST" });
        return tags;
      },
    }),
    addPostFavorite: builder.mutation<any, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/add-post-favorite`,
        method: "POST",
        body: {
          postId: Number(postId),
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Reel", id: String(arg.postId) },
        { type: "Reel", id: "LIST" },
      ],
    }),
    viewPost: builder.mutation<any, { postId: string | number }>({
      query: ({ postId }) => ({
        url: `/Post/view-post`,
        method: "POST",
        params: { postId: Number(postId) },
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetReelsQuery,
  useGetUsersQuery,
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useViewPostMutation,
} = reelsApi;
