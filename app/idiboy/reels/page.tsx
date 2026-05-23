"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGetReelsQuery, useLikePostMutation, useAddCommentMutation } from "@/store/api/reelsApi";
import ReelCard from "./components/ReelCard";
import ReelSkeleton from "@/components/reels/ReelSkeleton";
import { Reel, Comment } from "./types";
import { MOCK_COMMENTS } from "./components/mockData";
import { WifiOff, Film, RefreshCw, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IdiboyReelsPage() {
  // 1. Fetch from Swagger endpoint via RTK Query
  const { data: reelsFromApi, isLoading, isError, error, refetch } = useGetReelsQuery(
    { pageNumber: 1, pageSize: 10 },
    { refetchOnMountOrArgChange: true }
  );

  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();

  // 2. Local state to manage interactive actions locally (likes, saves, comments)
  const [reelsList, setReelsList] = useState<Reel[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [activeReelId, setActiveReelId] = useState<string>("");
  const [isMuted, setIsMuted] = useState(true);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if unauthorized (401 / 403) or generic error
  const isUnauthorized = 
    isError && 
    error && 
    (
      (typeof error === "object" && "status" in error && (error.status === 401 || error.status === 403)) ||
      (typeof error === "object" && "originalStatus" in error && (error.originalStatus === 401 || error.originalStatus === 403))
    );

  useEffect(() => {
    if (isError) {
      window.location.href = "/login";
    }
  }, [isError]);

  // Initialize reels list and comments map
  useEffect(() => {
    let activeReels: Reel[] = [];
    if (reelsFromApi && reelsFromApi.length > 0) {
      activeReels = reelsFromApi;
    }

    setReelsList(activeReels);

    if (activeReels.length > 0) {
      setActiveReelId(activeReels[0].id);
    }

    // Populate comments map with initial mock comments
    const initialComments: Record<string, Comment[]> = {};
    activeReels.forEach((reel) => {
      initialComments[reel.id] = MOCK_COMMENTS;
    });
    setCommentsMap(initialComments);
  }, [reelsFromApi]);

  // Set up Intersection Observer to track which Reel is active
  useEffect(() => {
    const container = containerRef.current;
    if (!container || reelsList.length === 0) return;

    const observerOptions = {
      root: container,
      rootMargin: "0px",
      threshold: 0.6,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const reelId = entry.target.getAttribute("data-reel-id");
          if (reelId) {
            setActiveReelId(reelId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const childElements = container.querySelectorAll("[data-reel-id]");
    childElements.forEach((el) => observer.observe(el));

    return () => {
      childElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [reelsList]);

  // Local interaction handlers
  const handleLike = async (reelId: string) => {
    // Optimistic update
    setReelsList((prevList) =>
      prevList.map((reel) => {
        if (reel.id === reelId) {
          const isLiked = !reel.isLiked;
          return {
            ...reel,
            isLiked,
            likesCount: isLiked ? reel.likesCount + 1 : Math.max(0, reel.likesCount - 1),
          };
        }
        return reel;
      })
    );

    // Global API Call
    try {
      const numericId = parseInt(reelId, 10);
      if (!isNaN(numericId)) {
        await likePost(numericId).unwrap();
      }
    } catch (err) {
      console.error("Failed to like post", err);
    }
  };

  const handleSave = (reelId: string) => {
    setReelsList((prevList) =>
      prevList.map((reel) => {
        if (reel.id === reelId) {
          return {
            ...reel,
            isSaved: !reel.isSaved,
          };
        }
        return reel;
      })
    );
  };

  const handleToggleFollow = (username: string) => {
    setReelsList((prevList) =>
      prevList.map((reel) => {
        if (reel.creator.username === username) {
          return {
            ...reel,
            creator: {
              ...reel.creator,
              isFollowing: !reel.creator.isFollowing,
            },
          };
        }
        return reel;
      })
    );
  };

  const handleAddComment = async (reelId: string, text: string) => {
    // Global API Call
    try {
      const numericId = parseInt(reelId, 10);
      if (!isNaN(numericId)) {
        await addComment({ postId: numericId, comment: text }).unwrap();
      }

      const newCommentObj: Comment = {
        id: `new-comment-${Date.now()}`,
        username: "current_user",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=current_user",
        text,
        timestamp: "1с",
        likesCount: 0,
        isLiked: false,
        replies: [],
      };

      setCommentsMap((prevMap) => ({
        ...prevMap,
        [reelId]: [...(prevMap[reelId] || []), newCommentObj],
      }));

      // Update comment count on reel card
      setReelsList((prevList) =>
        prevList.map((reel) => {
          if (reel.id === reelId) {
            return {
              ...reel,
              commentsCount: reel.commentsCount + 1,
            };
          }
          return reel;
        })
      );
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleVideoEnded = () => {
    const currentIndex = reelsList.findIndex((r) => r.id === activeReelId);
    if (currentIndex !== -1 && currentIndex < reelsList.length - 1) {
      const nextReelElement = containerRef.current?.querySelector(
        `[data-reel-id="${reelsList[currentIndex + 1].id}"]`
      );
      if (nextReelElement) {
        nextReelElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black">
        <div className="w-full h-[calc(100vh-64px)] md:h-screen max-w-[460px] overflow-hidden bg-black flex flex-col">
          <ReelSkeleton />
        </div>
      </div>
    );
  }

  // Beautiful error/empty screens when API is offline or has no data
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";

  if (reelsList.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white px-4 py-6">
        <div className="w-full max-w-[460px] h-[calc(100vh-64px)] md:h-screen flex flex-col items-center justify-center bg-zinc-950 md:rounded-xl md:border md:border-zinc-900/50 p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-900/20 blur-[100px] pointer-events-none" />

          {isUnauthorized ? (
            <>
              <div className="w-18 h-18 rounded-full bg-amber-950/30 border border-amber-500/20 flex items-center justify-center mb-6 z-10 animate-pulse">
                <Lock className="w-9 h-9 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 tracking-tight z-10">Authentication Required</h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed max-w-[320px] z-10">
                You must be logged in to view Reels. The API server rejected this request with a 401 Unauthorized response.
              </p>
              <div className="w-full bg-zinc-900/50 rounded-xl p-4 mb-6 border border-zinc-800/80 text-left font-mono text-[11px] z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-zinc-500 font-sans">
                    <span>Endpoint:</span>
                    <span className="text-zinc-300 font-semibold">GET /Post/get-reels</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 font-sans">
                    <span>HTTP Status:</span>
                    <span className="text-amber-500 font-semibold">401 Unauthorized</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-zinc-500 font-sans">
                    <span>Base API URL:</span>
                    <span className="text-sky-400 break-all select-all font-medium mt-0.5">{apiUrl}</span>
                  </div>
                </div>
              </div>
              <a
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full font-semibold text-sm hover:opacity-95 hover:shadow-[0_4px_20px_rgba(14,165,233,0.3)] active:scale-95 transition-all text-white cursor-pointer z-10 w-full max-w-[280px]"
              >
                <span>Go to Login Screen</span>
              </a>
            </>
          ) : isError ? (
            <>
              <div className="w-18 h-18 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center mb-6 animate-pulse z-10">
                <WifiOff className="w-9 h-9 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 tracking-tight z-10">API Connection Failed</h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed max-w-[320px] z-10">
                Could not establish a connection to the Reels API server. Please ensure the server is active and accessible.
              </p>
              <div className="w-full bg-zinc-900/50 rounded-xl p-4 mb-6 border border-zinc-800/80 text-left font-mono text-[11px] z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-zinc-500 font-sans">
                    <span>Endpoint:</span>
                    <span className="text-zinc-300 font-semibold">GET /Post/get-reels</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-zinc-500 font-sans">
                    <span>Target Server Base URL:</span>
                    <span className="text-sky-400 break-all select-all font-medium mt-0.5">{apiUrl}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 rounded-full font-semibold text-sm hover:opacity-95 hover:shadow-[0_4px_20px_rgba(147,51,234,0.3)] active:scale-95 transition-all text-white cursor-pointer z-10"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </>
          ) : (
            <>
              <div className="w-18 h-18 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 z-10">
                <Film className="w-9 h-9 text-zinc-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 tracking-tight z-10">No Reels Available</h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed max-w-[320px] z-10">
                The API server successfully returned an empty array of Reels. Check your database or seed data to load Reels.
              </p>
              <div className="w-full bg-zinc-900/50 rounded-xl p-4 mb-6 border border-zinc-800/80 text-left font-mono text-[11px] z-10 font-sans">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Response Status:</span>
                    <span className="text-green-500 font-semibold">200 OK</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-zinc-500 mt-1">
                    <span>Query Endpoint:</span>
                    <span className="text-sky-400 break-all select-all font-medium mt-0.5">{apiUrl}/Post/get-reels</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 rounded-full font-semibold text-sm hover:opacity-95 hover:shadow-[0_4px_20px_rgba(147,51,234,0.3)] active:scale-95 transition-all text-white cursor-pointer z-10"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black relative">
      {/* Snap-Scroll Reels Container */}
      <div
        ref={containerRef}
        className="w-full h-[calc(100vh-64px)] md:h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col items-center"
        style={{
          scrollSnapStop: "always",
        }}
      >
        {reelsList.map((reel) => (
          <div
            key={reel.id}
            data-reel-id={reel.id}
            className="w-full h-full flex-shrink-0 snap-start flex justify-center items-center"
          >
            <ReelCard
              reel={reel}
              isActive={reel.id === activeReelId}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              onLike={handleLike}
              onSave={handleSave}
              onToggleFollow={handleToggleFollow}
              comments={commentsMap[reel.id] || []}
              onAddComment={handleAddComment}
              onVideoEnded={handleVideoEnded}
              isAutoScrollActive={isAutoScrollActive}
            />
          </div>
        ))}
      </div>
    </div>
  );
}