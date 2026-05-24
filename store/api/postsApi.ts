import axios from "axios";
import { baseApi } from "./baseApi";
import type { ApiMessageResponse, ProfileId, ProfilePost, ProfilePostImage } from "@/types/profile";

const API_BASE_URL = "https://instagram-api.softclub.tj";
const POSTS_URL = `${API_BASE_URL}/Post/get-posts`;
const IMAGE_BASE_URL = `${API_BASE_URL}/images`;

type GetProfilePostsRequest = {
  userId?: ProfileId | null;
  title?: string;
  content?: string;
  pageNumber?: number;
  pageSize?: number;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getProfileId(value: unknown): ProfileId | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return undefined;
}

function unwrapPosts(response: unknown): unknown[] {
  const posts =
    (isRecord(response) &&
      isRecord(response.data) &&
      response.data.items) ||
    (isRecord(response) && response.data) ||
    (isRecord(response) && response.items) ||
    response ||
    [];

  if (Array.isArray(posts)) {
    return posts;
  }

  if (isRecord(posts)) {
    for (const key of ["items", "data", "posts", "result", "results"]) {
      const value = posts[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

function normalizeImageUrl(value: string) {
  if (!value) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  const cleanValue = value.replace(/^\/+/, "");
  if (cleanValue.startsWith("images/")) {
    return `${API_BASE_URL}/${cleanValue}`;
  }

  return `${IMAGE_BASE_URL}/${cleanValue}`;
}

function getImageFromObject(image: ProfilePostImage | UnknownRecord) {
  return (
    getString(image.imageUrl) ||
    getString(image.url) ||
    getString(image.image) ||
    getString(image.imageName) ||
    getString(image.ImageName) ||
    getString(image.name) ||
    getString(image.fileName) ||
    getString(image.path)
  );
}

function getFirstImage(rawPost: UnknownRecord) {
  const directImage =
    getString(rawPost.mediaUrl) ||
    getString(rawPost.imageUrl) ||
    getString(rawPost.url) ||
    getString(rawPost.image) ||
    getString(rawPost.imageName) ||
    getString(rawPost.ImageName) ||
    getString(rawPost.thumbnailUrl);

  if (directImage) {
    return normalizeImageUrl(directImage);
  }

  for (const key of ["images", "Images", "postImages", "photos", "files"]) {
    const value = rawPost[key];
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }

    const firstImage = value[0];
    const imageValue =
      typeof firstImage === "string"
        ? firstImage
        : isRecord(firstImage)
          ? getImageFromObject(firstImage)
          : "";

    if (imageValue) {
      return normalizeImageUrl(imageValue);
    }
  }

  return "";
}

function getCount(rawPost: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = rawPost[key];
    if (typeof value === "number") {
      return value;
    }
  }

  return 0;
}

function mapPost(post: unknown): ProfilePost {
  if (!isRecord(post)) {
    return {};
  }

  const imageUrl = getFirstImage(post);
  const content = getString(post.content) || getString(post.Content);
  const title = getString(post.title) || getString(post.Title);

  return {
    ...(post as ProfilePost),
    id: getProfileId(post.id) ?? getProfileId(post.postId),
    postId: getProfileId(post.postId) ?? getProfileId(post.id),
    userId: getProfileId(post.userId) ?? getProfileId(post.UserId),
    title,
    content,
    caption: getString(post.caption) || content || title,
    mediaUrl: imageUrl,
    imageUrl,
    imageName:
      getString(post.imageName) ||
      getString(post.ImageName) ||
      (imageUrl ? imageUrl.split("/").pop() : undefined),
    likesCount: getCount(post, ["likesCount", "likeCount", "likes"]),
    commentsCount: getCount(post, [
      "commentsCount",
      "commentCount",
      "comments",
    ]),
    createdAt: getString(post.createdAt) || getString(post.datePublished),
  };
}

export const postsApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getProfilePosts: builder.query<ProfilePost[], GetProfilePostsRequest>({
      async queryFn({
        userId,
        title,
        content,
        pageNumber = 1,
        pageSize = 50,
      }) {
        const token =
          typeof window === "undefined" ? null : localStorage.getItem("token");

        if (!token) {
          return {
            error: {
              status: 401,
              data: "Вы не авторизованы",
            },
          };
        }

        try {
          const params: Record<string, ProfileId | string | number> = {
            PageNumber: pageNumber,
            PageSize: pageSize,
          };
          const realUserId =
            userId === undefined || userId === null ? "" : String(userId).trim();

          if (realUserId) {
            params.UserId = realUserId;
          }

          if (title) {
            params.Title = title;
          }

          if (content) {
            params.Content = content;
          }

          const response = await axios.get(POSTS_URL, {
            params,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log("posts response:", response.data);

          return {
            data: unwrapPosts(response.data).map(mapPost),
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (typeof error.response?.status === "number") {
              return {
                error: {
                  status: error.response.status,
                  data:
                    error.response.status === 401
                      ? "Вы не авторизованы"
                      : error.response.data || error.message,
                },
              };
            }

            return {
              error: {
                status: "CUSTOM_ERROR",
                error: error.message,
                data: error.response?.data,
              },
            };
          }

          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Не удалось загрузить публикации",
              data: "Не удалось загрузить публикации",
            },
          };
        }
      },
      providesTags: (_result, _error, request) => [
        { type: "Post", id: `PROFILE-${request.userId ?? "ME"}` },
      ],
    }),
    addComment: builder.mutation<ApiMessageResponse, { comment: string; postId: number }>({
      query: (body) => ({
        url: "Post/add-comment",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Post" }],
    }),
    deleteComment: builder.mutation<ApiMessageResponse, number>({
      query: (commentId) => ({
        url: "Post/delete-comment",
        method: "DELETE",
        params: { commentId },
      }),
      invalidatesTags: [{ type: "Post" }],
    }),
    likePost: builder.mutation<ApiMessageResponse, number>({
      query: (postId) => ({
        url: "Post/like-post",
        method: "POST",
        params: { postId },
      }),
      invalidatesTags: [{ type: "Post" }],
    }),
    deletePost: builder.mutation<ApiMessageResponse, number>({
      query: (id) => ({
        url: "Post/delete-post",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: [{ type: "Post" }],
    }),
  }),
});

export const {
  useGetProfilePostsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useLikePostMutation,
  useDeletePostMutation,
} = postsApi;
