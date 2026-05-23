import { Reel } from "./types";

export const INITIAL_REELS: Reel[] = [
  {
    id: "mock-1",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-in-front-of-a-mirror-40011-large.mp4",
    creator: {
      id: "u-1",
      username: "neon_dreamer",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isFollowing: false,
    },
    caption: "Late night reflections under the city lights.",
    audioName: "neon_dreamer • Original Audio",
    likesCount: 14205,
    commentsCount: 5,
    isLiked: false,
    isSaved: false,
  }
];

const MockData = () => {
  return null;
};

export default MockData;