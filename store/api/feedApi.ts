import { baseApi } from "./baseApi";

export interface Comment {
  postCommentId: number;
  userId: string;
  userName: string;
  userImage: string | null;
  dateCommented: string;
  comment: string;
}

export interface Post {
  postId: number;
  userId: string;
  userName: string;
  userImage: string | null;
  datePublished: string;
  images: string[];
  postLike: boolean;
  postLikeCount: number;
  commentCount: number;
  comments: Comment[];
  postView: number;
  postFavorite: boolean;
  title: string | null;
  content: string | null;
}

export interface Reel {
  postId: number;
  userId: string;
  userName: string;
  userImage: string | null;
  datePublished: string;
  images: string; // Reels images is a single string for video path
  postLike: boolean;
  postLikeCount: number;
  commentCount: number;
  comments: Comment[];
  postView: number;
  postFavorite: boolean;
  title: string | null;
  content: string | null;
  isSubscriber: boolean;
}

export interface ApiResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  data: T[];
  errors: string[];
  statusCode: number;
}

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<ApiResponse<Post>, { userId?: string; title?: string; content?: string; pageNumber?: number; pageSize?: number } | void>({
      query: (params) => ({
        url: "/Post/get-posts",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    getReels: builder.query<ApiResponse<Reel>, { pageNumber?: number; pageSize?: number } | void>({
      query: (params) => ({
        url: "/Post/get-reels",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ postId }) => ({ type: "Reel" as const, id: postId })),
              { type: "Reel", id: "LIST" },
            ]
          : [{ type: "Reel", id: "LIST" }],
    }),

    likePost: builder.mutation<any, number>({
      query: (postId) => ({
        url: "/Post/like-post",
        method: "POST",
        params: { postId },
      }),
      invalidatesTags: (result, error, postId) => [
        { type: "Post", id: postId },
        { type: "Reel", id: postId },
      ],
    }),

    addComment: builder.mutation<any, { postId: number; comment: string }>({
      query: (body) => ({
        url: "/Post/add-comment",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Reel", id: postId },
      ],
    }),

    getPostById: builder.query<{ data: Post | null; errors: string[]; statusCode: number }, number>({
      query: (id) => ({
        url: "/Post/get-post-by-id",
        params: { id },
      }),
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    getMyPosts: builder.query<Post[], void>({
      query: () => "/Post/get-my-posts",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "MY_LIST" },
            ]
          : [{ type: "Post", id: "MY_LIST" }],
    }),

    getFollowingPosts: builder.query<ApiResponse<Post>, { userId?: string; pageNumber?: number; pageSize?: number } | void>({
      query: (params) => ({
        url: "/Post/get-following-post",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "FOLLOWING_LIST" },
            ]
          : [{ type: "Post", id: "FOLLOWING_LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetFeedQuery,
  useGetReelsQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useGetPostByIdQuery,
  useGetMyPostsQuery,
  useGetFollowingPostsQuery,
} = feedApi;
