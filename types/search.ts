import type { ProfileId } from "./profile";

export type SearchUser = {
  id?: ProfileId;
  userId?: ProfileId;
  username?: string;
  userName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  // avatar fields (API may return any of these)
  avatarUrl?: string;
  imageUrl?: string;
  image?: string;
  avatar?: string;
  userImage?: string;   // ← API field
  followersCount?: number;
  followingCount?: number;
  subscribersCount?: number;
  subscriptionsCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isFollowed?: boolean;
  email?: string;
  description?: string;
  isVerified?: boolean;
  verified?: boolean;
  isFamous?: boolean;
};

export type SearchHistory = {
  id?: ProfileId;
  searchHistoryId?: ProfileId;
  userId?: ProfileId;
  searchedUserId?: ProfileId;
  username?: string;
  userName?: string;
  fullName?: string;
  searchText?: string;
  query?: string;
  text?: string;
  createdAt?: string;
  user?: SearchUser;
  searchedUser?: SearchUser;
};

export type HistoryUser = {
  id: string;
  username: string;
  fullname: string;
  avatar: string | null;
  followers: number;
  isVerified: boolean;
};

export type HistoryItem = {
  id: string;
  type: "user" | "query";
  query?: string;
  user?: HistoryUser;
  createdAt: number;
};

export type SearchUsersQuery = {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type AddSearchHistoryRequest = {
  searchText?: string;
  query?: string;
  userId?: ProfileId;
  searchedUserId?: ProfileId;
};

export type AddUserSearchHistoryRequest = {
  userId?: ProfileId;
  searchedUserId?: ProfileId;
};

export type DeleteSearchHistoryRequest = {
  id?: ProfileId;
  searchHistoryId?: ProfileId;
};

