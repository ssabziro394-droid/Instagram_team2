export type ProfileId = string | number;

export type PostComment = {
  postCommentId?: number;
  userId?: ProfileId;
  userName?: string;
  userImage?: string;
  comment?: string;
  dateCommented?: string;
};

export type ProfilePost = {
  id?: ProfileId;
  postId?: ProfileId;
  userId?: ProfileId;
  title?: string;
  content?: string;
  mediaUrl?: string;
  imageUrl?: string;
  imageName?: string;
  image?: string;
  url?: string;
  images?: Array<string | ProfilePostImage>;
  Images?: Array<string | ProfilePostImage>;
  postImages?: Array<string | ProfilePostImage>;
  photos?: Array<string | ProfilePostImage>;
  caption?: string;
  likesCount?: number;
  likeCount?: number;
  commentsCount?: number;
  commentCount?: number;
  createdAt?: string;
  postLike?: boolean;
  comments?: PostComment[];
};

export type ProfilePostImage = {
  imageName?: string;
  ImageName?: string;
  imageUrl?: string;
  url?: string;
  image?: string;
  name?: string;
  fileName?: string;
  path?: string;
};

export type UserProfile = {
  id?: ProfileId;
  userId?: ProfileId;
  data?: {
    id?: ProfileId;
    userId?: ProfileId;
  };
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
  id?: ProfileId;
  userId?: ProfileId;
  userProfileId?: ProfileId;
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
  gender?: string;
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
