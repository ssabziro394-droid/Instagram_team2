export interface Reel {
  id: string;
  videoUrl: string;
  creator: {
    id?: string;
    username: string;
    avatarUrl: string;
    isFollowing: boolean;
  };
  caption: string;
  audioName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface Comment {
  id: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  replies?: Comment[];
}


