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
  const id = profile.id ?? profile.userId ?? profile.userProfileId;

  return {
    id,
    userId: profile.userId ?? profile.id ?? profile.userProfileId,
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
    // isFollowing comes separately from getIsFollowUserProfileById
    isFollowing: (profile as unknown as Record<string, unknown>).isFollowing === true,
  };
}

function getUserIdFromStorageToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    return undefined;
  }
  try {
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    const userId = 
      payload.sid ?? 
      payload.id ?? 
      payload.userId ?? 
      payload.sub ?? 
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid"];
    return userId ? String(userId) : undefined;
  } catch (error) {
    console.error("Error decoding token in mapMyProfileResponse:", error);
    return undefined;
  }
}

function mapMyProfileResponse(response: unknown): UserProfile {
  console.log("profile:", response);

  const data =
    isRecord(response) && isRecord(response.data) ? response.data : response;
  const mappedProfile = mapSwaggerProfile(data as UserProfileSwaggerDto);
  const wrapperId = isRecord(response) ? response.id ?? response.userId : undefined;
  const dataId = isRecord(data) ? data.id ?? data.userId : undefined;
  
  const tokenUserId = getUserIdFromStorageToken();
  const id = mappedProfile.id ?? wrapperId ?? dataId ?? tokenUserId;
  const userId = mappedProfile.userId ?? wrapperId ?? dataId ?? tokenUserId;

  return {
    ...mappedProfile,
    id: id as ProfileId | undefined,
    userId: userId as ProfileId | undefined,
    data: isRecord(data)
      ? {
          id: data.id as ProfileId | undefined,
          userId: data.userId as ProfileId | undefined,
        }
      : undefined,
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
    formData.append("imageFile", file);
  }

  return formData;
}

export const profileApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getUserProfileById: builder.query<UserProfile, ProfileId>({
      query: (id) => ({
        url: "UserProfile/get-user-profile-by-id",
        params: profileIdParams(id),
      }),
      transformResponse: (response: unknown, meta, arg) => {
        const mapped = mapMyProfileResponse(response);
        return {
          ...mapped,
          id: arg,
          userId: arg,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    getMyProfile: builder.query<UserProfile, void>({
      query: () => "UserProfile/get-my-profile",
      transformResponse: (response: UserProfileResponse) =>
        mapMyProfileResponse(response),
      providesTags: [{ type: "User", id: "ME" }],
    }),
    updateUserProfile: builder.mutation<
      UserProfile,
      UpdateUserProfileRequest
    >({
      query: (body) => {
        let genderId = 0;
        if (body.gender !== undefined) {
          if (typeof body.gender === "number") {
            genderId = body.gender;
          } else {
            const val = String(body.gender).trim();
            if (val === "Женский" || val === "1") {
              genderId = 1;
            } else if (val === "Не указано" || val === "2") {
              genderId = 2;
            }
          }
        }

        return {
          url: "UserProfile/update-user-profile",
          method: "PUT",
          body: {
            about: body.about ?? body.bio ?? "",
            gender: genderId,
          },
        };
      },
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
    getIsFollowUserProfileById: builder.query<boolean, string>({
      query: (followingUserId) => ({
        url: "UserProfile/get-is-follow-user-profile-by-id",
        params: { followingUserId },
      }),
      transformResponse: (response: unknown) => {
        console.log("[isFollow API raw response]:", JSON.stringify(response));
        
        if (response && typeof response === "object") {
          const record = response as Record<string, unknown>;
          // If the response is wrapped in { data: { isSubscriber: ... } }
          if (record.data && typeof record.data === "object") {
            const dataObj = record.data as Record<string, unknown>;
            const followStatus =
              dataObj.isSubscriber ??
              dataObj.isFollowing ??
              dataObj.isFollowed ??
              dataObj.subscribed;
            if (followStatus !== undefined) return Boolean(followStatus);
          }
          
          // Fallback if data is directly the object containing isSubscriber
          const followStatusDirect =
            record.isSubscriber ??
            record.isFollowing ??
            record.isFollowed ??
            record.subscribed;
          if (followStatusDirect !== undefined) return Boolean(followStatusDirect);
          
          const unwrapped = record.data ?? record.result ?? record.value ?? response;
          if (unwrapped === "true" || unwrapped === true || unwrapped === 1) return true;
          if (unwrapped === "false" || unwrapped === false || unwrapped === 0 || unwrapped === null) return false;
        }
        
        return false;
      },
      providesTags: (_result, _error, id) => [{ type: "User" as const, id: `FOLLOW_${id}` }],
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
        params: relationshipParams(body),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: (result, error, arg) => {
        const targetId = arg.followingUserId ?? arg.followingId ?? arg.targetUserId ?? arg.userId;
        return [
          { type: "User" as const, id: "LIST" },
          { type: "User" as const, id: "ME" },
          ...(targetId ? [
            { type: "User" as const, id: targetId },
            { type: "User" as const, id: `FOLLOW_${targetId}` },
          ] : []),
        ];
      },
    }),
    profileUnfollowUser: builder.mutation<ApiMessageResponse, FollowUserRequest>({
      query: (body) => ({
        url: "FollowingRelationShip/delete-following-relation-ship",
        method: "DELETE",
        params: relationshipParams(body),
      }),
      transformResponse: (response: unknown) =>
        unwrapResponse<ApiMessageResponse>(response),
      invalidatesTags: (result, error, arg) => {
        const targetId = arg.followingUserId ?? arg.followingId ?? arg.targetUserId ?? arg.userId;
        return [
          { type: "User" as const, id: "LIST" },
          { type: "User" as const, id: "ME" },
          ...(targetId ? [
            { type: "User" as const, id: targetId },
            { type: "User" as const, id: `FOLLOW_${targetId}` },
          ] : []),
        ];
      },
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
  useGetIsFollowUserProfileByIdQuery,
  useProfileGetSubscribersQuery,
  useProfileGetSubscriptionsQuery,
  useGetUserProfileByIdQuery,
  useProfileUnfollowUserMutation,
  useUpdateUserImageProfileMutation,
  useUpdateUserProfileMutation,
} = profileApi;
