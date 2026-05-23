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
    getPlayableReels: builder.query<Reel[], { pageNumber?: number; pageSize?: number } | void>({
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
  }),
  overrideExisting: false,
});

export const { useGetPlayableReelsQuery } = reelsApi;
export const useGetReelsQuery = useGetPlayableReelsQuery;
