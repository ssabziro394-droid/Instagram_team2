"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGetReelsQuery } from "@/store/api/feedApi";
import ReelCard from "./ReelCard";
import { RefreshCw, VideoOff } from "lucide-react";

export default function ReelsList() {
  const { data, isLoading, error, refetch } = useGetReelsQuery({
    pageNumber: 1,
    pageSize: 15,
  });

  const reels = data?.data || [];
  const [activeId, setActiveId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer to detect which reel is in the middle of the viewport
  useEffect(() => {
    if (reels.length === 0) return;
    
    // Set initial active reel
    setActiveId(reels[0].postId);

    const observerOptions = {
      root: containerRef.current || null,
      rootMargin: "0px",
      threshold: 0.6, // Must be 60% visible to count as active
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.getAttribute("data-reel-id"));
          if (id) {
            setActiveId(id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // We need a short timeout to ensure the elements are rendered
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll("[data-reel-id]");
      elements.forEach((el) => observer.observe(el));
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [reels]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh] w-full max-w-[420px] mx-auto bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse p-6">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
            <div className="w-20 h-4 bg-zinc-900 rounded"></div>
          </div>
          <div className="w-8 h-8 rounded bg-zinc-900"></div>
        </div>
        <div className="flex-1 w-full bg-zinc-900 rounded-xl mb-4"></div>
        <div className="w-full flex justify-between">
          <div className="w-24 h-4 bg-zinc-900 rounded"></div>
          <div className="w-12 h-4 bg-zinc-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-zinc-800 rounded-2xl bg-zinc-950/50 backdrop-blur text-center max-w-sm mx-auto my-12">
        <span className="text-red-500 font-medium mb-2">Failed to load Reels</span>
        <p className="text-zinc-500 text-xs max-w-xs mb-6">
          There was an error communicating with the Instagram servers. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 max-w-sm mx-auto my-12">
        <VideoOff className="h-10 w-10 text-zinc-600 mb-4" />
        <h3 className="font-semibold text-zinc-300 mb-1">No Reels found</h3>
        <p className="text-zinc-500 text-xs max-w-xs mb-6">
          The Reels feed is currently empty. Add vertical videos to populate the feed.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-[78vh] overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col items-center gap-6 py-4 px-2 w-full max-w-[440px] mx-auto scroll-smooth"
      style={{
        msOverflowStyle: "none",
        scrollbarWidth: "none"
      }}
    >
      {reels.map((reel) => (
        <div 
          key={reel.postId}
          data-reel-id={reel.postId}
          className="snap-start snap-always w-full flex justify-center py-2 shrink-0"
        >
          <ReelCard 
            reel={reel} 
            isActive={activeId === reel.postId} 
          />
        </div>
      ))}
    </div>
  );
}
