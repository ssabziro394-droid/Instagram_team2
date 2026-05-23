import { Reel, Comment } from "../types";

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    username: "b.faromuz",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
    text: "@dodarbek_99 Фахмиди😂",
    timestamp: "1 дн.",
    likesCount: 2,
    isLiked: false,
    replies: []
  },
  {
    id: "c2",
    username: "yasin_sharipov",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    text: "Манба ягон проблема нест киёмат хайку👏😂",
    timestamp: "21 ч.",
    likesCount: 1,
    isLiked: false,
    replies: []
  },
  {
    id: "c3",
    username: "kosimzoda_0007",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    text: "zona 🔥",
    timestamp: "2 дн.",
    likesCount: 1,
    isLiked: false,
    replies: []
  },
  {
    id: "c4",
    username: "abujon_group",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "@kosimzoda_0007 🫣🫣",
    timestamp: "2 дн.",
    likesCount: 0,
    isLiked: false,
    isAuthor: true,
    replies: []
  },
  {
    id: "c5",
    username: "daler_2oo9",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    text: "@bobojonzoda_oo9 @_bobojonzoda_1331 😂😂",
    timestamp: "1 дн.",
    likesCount: 2,
    isLiked: false,
    replies: [
      {
        id: "r1",
        username: "bobojonzoda_oo9",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
        text: "Ҳа бародар, фаҳмидем! Гап нест 👍",
        timestamp: "1 дн.",
        likesCount: 1,
        isLiked: false
      }
    ]
  },
  {
    id: "c6",
    username: "xilol_oo7",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    text: "Беҳтарин ролик бародар, давом деҳ! 🚀🙌",
    timestamp: "1 дн.",
    likesCount: 0,
    isLiked: false,
    replies: []
  }
];

export const MOCK_REELS: Reel[] = [
  {
    id: "mock-1",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-in-front-of-a-mirror-40011-large.mp4",
    creator: {
      id: "u-1",
      username: "neon_dreamer",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isFollowing: false,
    },
    caption: "Late night reflections under the city lights. Cyberpunk aesthetic in full force. 🌆✨ #neon #cyberpunk #streetstyle #aesthetic",
    audioName: "neon_dreamer • Original Audio (Synthwave Mix)",
    likesCount: 14205,
    commentsCount: MOCK_COMMENTS.length,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "mock-2",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-front-of-a-wall-with-neon-lights-40003-large.mp4",
    creator: {
      id: "u-2",
      username: "cyber_dancer",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isFollowing: true,
    },
    caption: "Feeling the beat of the neon rhythm. Dance like no one is watching but everyone is double-tapping! 💃🎶 #dance #neonlights #vibes #express",
    audioName: "Aesthetic Beats • Tokyo Drift Remix",
    likesCount: 8940,
    commentsCount: 32,
    isLiked: false,
    isSaved: true,
  },
  {
    id: "mock-3",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-taking-photos-with-a-smartphone-in-front-of-neon-lights-40001-large.mp4",
    creator: {
      id: "u-3",
      username: "street_shooter",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isFollowing: false,
    },
    caption: "Behind the lens: capturing the high-definition reflections of the nocturnal metropolis. Mobile photography tips in bio. 📸📲 #mobilephotography #streetphotography #neonedits",
    audioName: "Lofi Street Vibes • Late Night Session",
    likesCount: 5210,
    commentsCount: 18,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "mock-4",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-tree-branches-swaying-in-front-of-the-sun-41618-large.mp4",
    creator: {
      id: "u-4",
      username: "nature_lens",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      isFollowing: false,
    },
    caption: "Golden hour magic. Finding peace in the simple rustle of green leaves under the setting sun. 🌿🌅 #goldenhour #sunset #naturephotography #relax",
    audioName: "nature_lens • Organic Acoustic Guitar (Live)",
    likesCount: 3450,
    commentsCount: 9,
    isLiked: false,
    isSaved: false,
  }
];
