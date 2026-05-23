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

export interface StoryItem {
  id: number;
  fileName: string | null;
  postId: number | null;
  createAt: string;
  userId: string | null;
  userAvatar: string | null;
  viewerDto?: {
    userName: string | null;
    name: string | null;
    viewCount: number | null;
    viewLike: number | null;
  };
}

export interface UserStories {
  userId: string;
  userName: string;
  userImage: string | null;
  stories: StoryItem[];
}


export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query<ApiResponse<Post>, { userId?: string; title?: string; content?: string; pageNumber?: number; pageSize?: number } | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {};
        
        // Ensure default required query params are set and formatted in PascalCase
        queryParams.PageNumber = params?.pageNumber ?? 1;
        queryParams.PageSize = params?.pageSize ?? 10;
        
        // Only send optional parameters if they exist and are non-empty
        if (params?.userId) {
          queryParams.UserId = params.userId;
        }
        if (params?.title) {
          queryParams.Title = params.title;
        }
        if (params?.content) {
          queryParams.Content = params.content;
        }

        return {
          url: "/Post/get-posts",
          params: queryParams,
        };
      },
      transformResponse: (response: ApiResponse<Post> | null): ApiResponse<Post> => {
        const rawData = response?.data || [];
        const normalizedData: Post[] = Array.isArray(rawData)
          ? rawData.map(post => ({
              postId: post?.postId ?? 0,
              userId: post?.userId ?? "",
              userName: post?.userName ?? "anonymous",
              userImage: post?.userImage ?? null,
              datePublished: post?.datePublished ?? new Date().toISOString(),
              images: Array.isArray(post?.images)
                ? post.images
                : (typeof post?.images === "string" && post.images ? [post.images] : []),
              postLike: !!post?.postLike,
              postLikeCount: post?.postLikeCount ?? 0,
              commentCount: post?.commentCount ?? 0,
              comments: Array.isArray(post?.comments)
                ? post.comments.map(comment => ({
                    postCommentId: comment?.postCommentId ?? 0,
                    userId: comment?.userId ?? "",
                    userName: comment?.userName ?? "anonymous",
                    userImage: comment?.userImage ?? null,
                    dateCommented: comment?.dateCommented ?? new Date().toISOString(),
                    comment: comment?.comment ?? "",
                  }))
                : [],
              postView: post?.postView ?? 0,
              postFavorite: !!post?.postFavorite,
              title: post?.title ?? "",
              content: post?.content ?? "",
            }))
          : [];

        return {
          pageNumber: response?.pageNumber ?? 1,
          pageSize: response?.pageSize ?? 10,
          totalPage: response?.totalPage ?? 1,
          totalRecord: response?.totalRecord ?? 0,
          data: normalizedData,
          errors: response?.errors || [],
          statusCode: response?.statusCode ?? 200,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    getReels: builder.query<ApiResponse<Reel>, { pageNumber?: number; pageSize?: number } | void>({
      query: (params) => {
        const queryParams: Record<string, number> = {};
        queryParams.PageNumber = params?.pageNumber ?? 1;
        queryParams.PageSize = params?.pageSize ?? 10;
        return {
          url: "/Post/get-reels",
          params: queryParams,
        };
      },
      transformResponse: (response: ApiResponse<Reel> | null): ApiResponse<Reel> => {
        const rawData = response?.data || [];
        const normalizedData: Reel[] = Array.isArray(rawData)
          ? rawData.map(reel => ({
              postId: reel?.postId ?? 0,
              userId: reel?.userId ?? "",
              userName: reel?.userName ?? "anonymous",
              userImage: reel?.userImage ?? null,
              datePublished: reel?.datePublished ?? new Date().toISOString(),
              images: reel?.images ?? "",
              postLike: !!reel?.postLike,
              postLikeCount: reel?.postLikeCount ?? 0,
              commentCount: reel?.commentCount ?? 0,
              comments: Array.isArray(reel?.comments)
                ? reel.comments.map(comment => ({
                    postCommentId: comment?.postCommentId ?? 0,
                    userId: comment?.userId ?? "",
                    userName: comment?.userName ?? "anonymous",
                    userImage: comment?.userImage ?? null,
                    dateCommented: comment?.dateCommented ?? new Date().toISOString(),
                    comment: comment?.comment ?? "",
                  }))
                : [],
              postView: reel?.postView ?? 0,
              postFavorite: !!reel?.postFavorite,
              title: reel?.title ?? "",
              content: reel?.content ?? "",
              isSubscriber: !!reel?.isSubscriber,
            }))
          : [];

        return {
          pageNumber: response?.pageNumber ?? 1,
          pageSize: response?.pageSize ?? 10,
          totalPage: response?.totalPage ?? 1,
          totalRecord: response?.totalRecord ?? 0,
          data: normalizedData,
          errors: response?.errors || [],
          statusCode: response?.statusCode ?? 200,
        };
      },
      providesTags: (result) =>
        result?.data
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
      // Removed invalidatesTags to prevent full feed refetch on every like
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

    deleteComment: builder.mutation<any, number>({
      query: (commentId) => ({
        url: "/Post/delete-comment",
        method: "DELETE",
        params: { commentId },
      }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    deletePost: builder.mutation<any, number>({
      query: (postId) => ({
        url: "/Post/delete-post",
        method: "DELETE",
        params: { postId },
      }),
      invalidatesTags: [
        { type: "Post", id: "LIST" },
        { type: "Post", id: "MY_LIST" },
        { type: "Post", id: "FOLLOWING_LIST" },
      ],
    }),

    createPost: builder.mutation<any, { title?: string; content?: string; images: File[] }>({
      query: ({ title, content, images }) => {
        const formData = new FormData();
        if (title) formData.append("Title", title);
        if (content) formData.append("Content", content);
        images.forEach((img) => formData.append("Images", img));
        return {
          url: "/Post/add-post",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [
        { type: "Post", id: "LIST" },
        { type: "Post", id: "MY_LIST" },
        { type: "Post", id: "FOLLOWING_LIST" },
      ],
    }),


    viewPost: builder.mutation<any, number>({
      query: (postId) => ({
        url: "/Post/view-post",
        method: "POST",
        params: { postId },
      }),
    }),

    getPostById: builder.query<{ data: Post | null; errors: string[]; statusCode: number }, number>({
      query: (id) => ({
        url: "/Post/get-post-by-id",
        params: { id },
      }),
      transformResponse: (response: { data: Post | null; errors: string[]; statusCode: number } | null): { data: Post | null; errors: string[]; statusCode: number } => {
        const post = response?.data;
        const normalizedPost: Post | null = post
          ? {
              postId: post.postId ?? 0,
              userId: post.userId ?? "",
              userName: post.userName ?? "anonymous",
              userImage: post.userImage ?? null,
              datePublished: post.datePublished ?? new Date().toISOString(),
              images: Array.isArray(post.images)
                ? post.images
                : (typeof post.images === "string" && post.images ? [post.images] : []),
              postLike: !!post.postLike,
              postLikeCount: post.postLikeCount ?? 0,
              commentCount: post.commentCount ?? 0,
              comments: Array.isArray(post.comments)
                ? post.comments.map(comment => ({
                    postCommentId: comment?.postCommentId ?? 0,
                    userId: comment?.userId ?? "",
                    userName: comment?.userName ?? "anonymous",
                    userImage: comment?.userImage ?? null,
                    dateCommented: comment?.dateCommented ?? new Date().toISOString(),
                    comment: comment?.comment ?? "",
                  }))
                : [],
              postView: post.postView ?? 0,
              postFavorite: !!post.postFavorite,
              title: post.title ?? "",
              content: post.content ?? "",
            }
          : null;

        return {
          data: normalizedPost,
          errors: response?.errors || [],
          statusCode: response?.statusCode ?? 200,
        };
      },
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    getMyPosts: builder.query<Post[], void>({
      query: () => "/Post/get-my-posts",
      transformResponse: (response: Post[] | null): Post[] => {
        const rawData = response || [];
        return Array.isArray(rawData)
          ? rawData.map(post => ({
              postId: post?.postId ?? 0,
              userId: post?.userId ?? "",
              userName: post?.userName ?? "anonymous",
              userImage: post?.userImage ?? null,
              datePublished: post?.datePublished ?? new Date().toISOString(),
              images: Array.isArray(post?.images)
                ? post.images
                : (typeof post?.images === "string" && post.images ? [post.images] : []),
              postLike: !!post?.postLike,
              postLikeCount: post?.postLikeCount ?? 0,
              commentCount: post?.commentCount ?? 0,
              comments: Array.isArray(post?.comments)
                ? post.comments.map(comment => ({
                    postCommentId: comment?.postCommentId ?? 0,
                    userId: comment?.userId ?? "",
                    userName: comment?.userName ?? "anonymous",
                    userImage: comment?.userImage ?? null,
                    dateCommented: comment?.dateCommented ?? new Date().toISOString(),
                    comment: comment?.comment ?? "",
                  }))
                : [],
              postView: post?.postView ?? 0,
              postFavorite: !!post?.postFavorite,
              title: post?.title ?? "",
              content: post?.content ?? "",
            }))
          : [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "MY_LIST" },
            ]
          : [{ type: "Post", id: "MY_LIST" }],
    }),

    getFollowingPosts: builder.query<ApiResponse<Post>, { userId?: string; pageNumber?: number; pageSize?: number } | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {};
        queryParams.PageNumber = params?.pageNumber ?? 1;
        queryParams.PageSize = params?.pageSize ?? 10;
        if (params?.userId) {
          queryParams.UserId = params.userId;
        }
        return {
          url: "/Post/get-following-post",
          params: queryParams,
        };
      },
      transformResponse: (response: ApiResponse<Post> | null): ApiResponse<Post> => {
        const rawData = response?.data || [];
        const normalizedData: Post[] = Array.isArray(rawData)
          ? rawData.map(post => ({
              postId: post?.postId ?? 0,
              userId: post?.userId ?? "",
              userName: post?.userName ?? "anonymous",
              userImage: post?.userImage ?? null,
              datePublished: post?.datePublished ?? new Date().toISOString(),
              images: Array.isArray(post?.images)
                ? post.images
                : (typeof post?.images === "string" && post.images ? [post.images] : []),
              postLike: !!post?.postLike,
              postLikeCount: post?.postLikeCount ?? 0,
              commentCount: post?.commentCount ?? 0,
              comments: Array.isArray(post?.comments)
                ? post.comments.map(comment => ({
                    postCommentId: comment?.postCommentId ?? 0,
                    userId: comment?.userId ?? "",
                    userName: comment?.userName ?? "anonymous",
                    userImage: comment?.userImage ?? null,
                    dateCommented: comment?.dateCommented ?? new Date().toISOString(),
                    comment: comment?.comment ?? "",
                  }))
                : [],
              postView: post?.postView ?? 0,
              postFavorite: !!post?.postFavorite,
              title: post?.title ?? "",
              content: post?.content ?? "",
            }))
          : [];

        return {
          pageNumber: response?.pageNumber ?? 1,
          pageSize: response?.pageSize ?? 10,
          totalPage: response?.totalPage ?? 1,
          totalRecord: response?.totalRecord ?? 0,
          data: normalizedData,
          errors: response?.errors || [],
          statusCode: response?.statusCode ?? 200,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ postId }) => ({ type: "Post" as const, id: postId })),
              { type: "Post", id: "FOLLOWING_LIST" },
            ]
          : [{ type: "Post", id: "FOLLOWING_LIST" }],
    }),

    getStories: builder.query<UserStories[], void>({
      query: () => "/Story/get-stories",
      providesTags: () => [{ type: "Post", id: "STORIES" }],
    }),

    getUserStories: builder.query<{ data: UserStories; errors: string[]; statusCode: number }, string>({
      query: (userId) => `/Story/get-user-stories/${userId}`,
      providesTags: (result, error, id) => [{ type: "Post", id: `USER_STORIES_${id}` }],
    }),

    getMyStories: builder.query<{ data: UserStories; errors: string[]; statusCode: number }, void>({
      query: () => "/Story/get-my-stories",
      providesTags: () => [{ type: "Post", id: "MY_STORIES" }],
    }),

    getStoryById: builder.query<{ data: StoryItem; errors: string[]; statusCode: number }, number>({
      query: (id) => ({
        url: "/Story/GetStoryById",
        params: { id },
      }),
      providesTags: (result, error, id) => [{ type: "Post", id: `STORY_${id}` }],
    }),

    addStory: builder.mutation<any, { image: File; postId?: number }>({
      query: ({ image, postId }) => {
        const formData = new FormData();
        formData.append("Image", image);
        return {
          url: "/Story/AddStories",
          method: "POST",
          params: postId ? { PostId: postId } : {},
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Post", id: "STORIES" }],
    }),

    deleteStory: builder.mutation<any, number>({
      query: (id) => ({
        url: "/Story/DeleteStory",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: [{ type: "Post", id: "STORIES" }],
    }),

    likeStory: builder.mutation<any, number>({
      query: (storyId) => ({
        url: "/Story/LikeStory",
        method: "POST",
        params: { storyId },
      }),
      invalidatesTags: [{ type: "Post", id: "STORIES" }],
    }),

    addStoryView: builder.mutation<any, number>({
      query: (storyId) => ({
        url: "/Story/add-story-view",
        method: "POST",
        params: { StoryId: storyId },
      }),
      invalidatesTags: [{ type: "Post", id: "STORIES" }],
    }),


  }),
  overrideExisting: true,
});

export const {
  useGetFeedQuery,
  useGetReelsQuery,
  useLikePostMutation,
  useViewPostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useDeletePostMutation,
  useCreatePostMutation,
  useGetPostByIdQuery,
  useGetMyPostsQuery,
  useGetFollowingPostsQuery,
  useGetStoriesQuery,
  useGetUserStoriesQuery,
  useLazyGetUserStoriesQuery,
  useGetMyStoriesQuery,
  useGetStoryByIdQuery,
  useAddStoryMutation,
  useDeleteStoryMutation,
  useLikeStoryMutation,
  useAddStoryViewMutation,

} = feedApi;
