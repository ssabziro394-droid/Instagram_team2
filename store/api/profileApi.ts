import { baseApi } from "./baseApi";
import type {
  ApiMessageResponse,
  FollowUserRequest,
  ProfileId,
  ProfileListQuery,
  ProfilePost,
  UpdateUserImageProfileRequest,
  UpdateUserProfileRequest,
  UserProfile,
  UserProfileResponse,
  UserProfileSwaggerDto,
} from "@/types/profile";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapResponse<T>(response: unknown): T {
  if (isRecord(response)) {
    for (const key of ["data", "result", "value", "payload"]) {
      const value = response[key];
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }
  }

  return response as T;
}

function unwrapList<T>(response: unknown): T[] {
  const value = unwrapResponse<unknown>(response);

  if (Array.isArray(value)) {
    return value as T[];
  }

  if (isRecord(value)) {
    for (const key of ["items", "users", "posts", "data", "result"]) {
      const list = value[key];
      if (Array.isArray(list)) {
        return list as T[];
      }
    }
  }

  return [];
}

function mapSwaggerProfile(profile: UserProfileSwaggerDto): UserProfile {
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  return {
    username: profile.userName,
    userName: profile.userName,
    avatar: profile.image,
    image: profile.image,
    avatarUrl: profile.image,
    postsCount: profile.postCount,
    postCount: profile.postCount,
    followersCount: profile.subscribersCount,
    subscribersCount: profile.subscribersCount,
    followingCount: profile.subscriptionsCount,
    subscriptionsCount: profile.subscriptionsCount,
    fullName,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.about,
    about: profile.about,
    dateUpdated: profile.dateUpdated,
    gender: profile.gender,
    locationId: profile.locationId,
    dob: profile.dob,
    occupation: profile.occupation,
  };
}

function profileIdParams(id: ProfileId) {
  return { id };
}

function listParams(query?: ProfileListQuery | ProfileId | void) {
  const userId = typeof query === "object" ? query.userId : query;
  return userId === undefined || userId === null ? undefined : { userId };
}

function relationshipParams(request: FollowUserRequest) {
  const userId =
    request.followingUserId ??
    request.followingId ??
    request.targetUserId ??
    request.userId;

  return userId === undefined || userId === null
    ? undefined
    : { followingUserId: userId };
}

function imageProfileBody(request: FormData | UpdateUserImageProfileRequest) {
  if (request instanceof FormData) {
    return request;
  }

  if (request.formData) {
    return request.formData;
  }

  const formData = new FormData();
  const file = request.file ?? request.image;
  if (file) {
    formData.append("file", file);
  }

  return formData;
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfileById: builder.query<UserProfile, ProfileId>({
      query: (id) => ({
        url: "UserProfile/get-user-profile-by-id",
        params: profileIdParams(id),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<UserProfile>(response),
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    getMyProfile: builder.query<UserProfile, void>({
      query: () => "UserProfile/get-my-profile",
      transformResponse: (response: UserProfileResponse) =>
        mapSwaggerProfile(response.data),
      providesTags: [{ type: "User", id: "ME" }],
    }),
    updateUserProfile: builder.mutation<
      UserProfile,
      UpdateUserProfileRequest
    >({
      query: (body) => ({
        url: "UserProfile/update-user-profile",
        method: "PUT",
        body,
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<UserProfile>(response),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    updateUserImageProfile: builder.mutation<
      UserProfile,
      FormData | UpdateUserImageProfileRequest
    >({
      query: (request) => ({
        url: "UserProfile/update-user-image-profile",
        method: "PUT",
        body: imageProfileBody(request),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<UserProfile>(response),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    deleteUserImageProfile: builder.mutation<ApiMessageResponse, void>({
      query: () => ({
        url: "UserProfile/delete-user-image-profile",
        method: "DELETE",
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "ME" }],
    }),
    getPostFavorites: builder.query<ProfilePost[], ProfileListQuery | ProfileId | void>({
      query: (query) => ({
        url: "UserProfile/get-post-favorites",
        params: listParams(query),
      }),
      transformResponse: (response: unknown) =>
        unwrapList<ProfilePost>(response),
      providesTags: [{ type: "Post", id: "FAVORITES" }],
    }),
    profileFollowUser: builder.mutation<ApiMessageResponse, FollowUserRequest>({
      query: (body) => ({
        url: "FollowingRelationShip/add-following-relation-ship",
        method: "POST",
        body,
        params: relationshipParams(body),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    profileUnfollowUser: builder.mutation<ApiMessageResponse, FollowUserRequest>({
      query: (body) => ({
        url: "FollowingRelationShip/delete-following-relation-ship",
        method: "DELETE",
        body,
        params: relationshipParams(body),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    profileGetSubscribers: builder.query<UserProfile[], ProfileListQuery | ProfileId>({
      query: (query) => ({
        url: "FollowingRelationShip/get-subscribers",
        params: listParams(query),
      }),
      transformResponse: (response: unknown) =>
        unwrapList<UserProfile>(response),
      providesTags: [{ type: "User", id: "SUBSCRIBERS" }],
    }),
    profileGetSubscriptions: builder.query<UserProfile[], ProfileListQuery | ProfileId>({
      query: (query) => ({
        url: "FollowingRelationShip/get-subscriptions",
        params: listParams(query),
      }),
      transformResponse: (response: unknown) =>
        unwrapList<UserProfile>(response),
      providesTags: [{ type: "User", id: "SUBSCRIPTIONS" }],
    }),
  }),
});

export const {
  useDeleteUserImageProfileMutation,
  useProfileFollowUserMutation,
  useGetMyProfileQuery,
  useGetPostFavoritesQuery,
  useProfileGetSubscribersQuery,
  useProfileGetSubscriptionsQuery,
  useGetUserProfileByIdQuery,
  useProfileUnfollowUserMutation,
  useUpdateUserImageProfileMutation,
  useUpdateUserProfileMutation,
} = profileApi;
