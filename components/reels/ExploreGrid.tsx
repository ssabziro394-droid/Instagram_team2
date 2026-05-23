"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Heart, MessageCircle } from "lucide-react";
import { Reel } from "./types";

interface ExploreGridProps {
  reels: Reel[];
  onReelClick: (reel: Reel) => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export default function ExploreGrid({
  reels,
  onReelClick,
  loadMore,
  hasMore,
  isLoadingMore,
}: ExploreGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Setup IntersectionObserver for scroll-to-load-more (infinite scroll)
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 3-Column Instagram-style Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4 lg:gap-6">
        {reels.map((reel) => (
          <GridItem key={reel.id} reel={reel} onClick={() => onReelClick(reel)} />
        ))}
      </div>

      {/* Sentinel for infinite scroll pagination */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="w-full flex items-center justify-center py-8"
        >
          {isLoadingMore && (
            <div className="w-8 h-8 rounded-full border-[3px] border-zinc-800 border-t-pink-500 border-r-purple-500 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

interface GridItemProps {
  reel: Reel;
  onClick: () => void;
}

function GridItem({ reel, onClick }: GridItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        // Log or handle auto-play block silently
        console.log("Play failed on hover: ", err);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[9/16] w-full bg-zinc-950 rounded-md sm:rounded-lg overflow-hidden group cursor-pointer border border-zinc-900/50 shadow-md transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={reel.videoUrl || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Loading shimmer fallback */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-zinc-500 animate-spin" />
        </div>
      )}

      {/* Top right icon (Reels/Play Icon) */}
      <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/45 backdrop-blur-sm text-white opacity-85 transition-opacity group-hover:opacity-0 pointer-events-none">
        <Play className="w-4 h-4 fill-white" />
      </div>

      {/* Hover action stats overlay (likes, comments count) */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white font-semibold text-sm pointer-events-none">
        <div className="flex items-center gap-1.5 drop-shadow-md">
          <Heart className="w-5 h-5 fill-white text-white" />
          <span>{reel.likesCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 drop-shadow-md">
          <MessageCircle className="w-5 h-5 fill-white text-white" />
          <span>{reel.commentsCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
