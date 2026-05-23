export type ProfileId = string | number;

export type ProfilePost = {
  id?: ProfileId;
  postId?: ProfileId;
  userId?: ProfileId;
  mediaUrl?: string;
  imageUrl?: string;
  image?: string;
  url?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
};

export type UserProfile = {
  id?: ProfileId;
  userId?: ProfileId;
  username?: string;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  about?: string;
  avatarUrl?: string;
  imageUrl?: string;
  image?: string;
  avatar?: string;
  dateUpdated?: string;
  gender?: string;
  locationId?: number;
  dob?: string;
  occupation?: string;
  postsCount?: number;
  postCount?: number;
  publicationsCount?: number;
  followersCount?: number;
  followingCount?: number;
  subscribersCount?: number;
  subscriptionsCount?: number;
  isFollowing?: boolean;
  isFollowed?: boolean;
  isMyProfile?: boolean;
  posts?: ProfilePost[];
  publications?: ProfilePost[];
};

export type UserProfileSwaggerDto = {
  userName: string;
  image: string;
  dateUpdated: string;
  gender: string;
  postCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
  firstName: string;
  lastName: string;
  locationId: number;
  dob: string;
  occupation: string;
  about: string;
};

export type UserProfileResponse = {
  data: UserProfileSwaggerDto;
  errors: string[];
  statusCode: number;
};

export type UpdateUserProfileRequest = {
  id?: ProfileId;
  userId?: ProfileId;
  username?: string;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  about?: string;
};

export type UpdateUserImageProfileRequest = {
  file?: File;
  image?: File;
  formData?: FormData;
};

export type FollowUserRequest = {
  userId?: ProfileId;
  followingUserId?: ProfileId;
  followingId?: ProfileId;
  targetUserId?: ProfileId;
};

export type ProfileListQuery = {
  userId?: ProfileId;
};

export type ApiMessageResponse = {
  succeeded?: boolean;
  success?: boolean;
  message?: string;
};
