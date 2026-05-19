export type User = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

export type Post = {
  id: string;
  userId: string;
  user: User;
  mediaUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};

export type Reel = Post & {
  duration?: number;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  user: User;
  text: string;
  createdAt: string;
};
