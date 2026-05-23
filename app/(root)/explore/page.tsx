"use client";

import { useEffect, useState } from "react";
import { useGetReelsQuery } from "@/store/api/reelsApi";
import ExploreGrid from "@/components/reels/ExploreGrid";
import ExploreReelModal from "@/components/reels/ExploreReelModal";
import { Reel } from "@/components/reels/types";
import { WifiOff, Film, RefreshCw } from "lucide-react";

export default function ExplorePage() {
  const [page, setPage] = useState(1);
  const [reelsList, setReelsList] = useState<Reel[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  // Fetch Reels from the Swagger backend
  const {
    data: newReels,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetReelsQuery(
    { pageNumber: page, pageSize: 12 },
    { refetchOnMountOrArgChange: true }
  );

  // Append new paginated items to state
  useEffect(() => {
    if (newReels) {
      if (newReels.length === 0) {
        setHasMore(false);
      } else {
        setReelsList((prev) => {
          // Prevent duplicates by checking item id
          const existingIds = new Set(prev.map((r) => r.id));
          const uniqueNew = newReels.filter((r) => !existingIds.has(r.id));
          if (uniqueNew.length === 0) {
            setHasMore(false);
            return prev;
          }
          return [...prev, ...uniqueNew];
        });
      }
    }
  }, [newReels]);

  const loadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    setPage(1);
    setReelsList([]);
    setHasMore(true);
    refetch();
  };

  const handleReelClick = (reel: Reel) => {
    setSelectedReel(reel);
  };

  const handleCloseModal = () => {
    setSelectedReel(null);
  };

  // Loading State (Initial page load)
  if (isLoading && page === 1) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center">
        {/* Shimmer skeleton grid loader */}
        <div className="w-full max-w-5xl px-4 py-8 grid grid-cols-3 gap-1 md:gap-4 lg:gap-6 animate-pulse">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-[9/16] w-full bg-zinc-900 rounded-md sm:rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error State (Initial load failed due to API connection issue)
  if (isError && reelsList.length === 0) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://instagram-api.softclub.tj";
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <div className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-900 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-900/10 blur-[80px] pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-500/25 flex items-center justify-center mb-6 mx-auto animate-pulse z-10">
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold mb-2 tracking-tight z-10">API Connection Failed</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed z-10">
            Could not fetch media items. Please check if the backend API server is online and try again.
          </p>

          <div className="w-full bg-zinc-900/50 rounded-xl p-4 mb-6 border border-zinc-800 text-left font-mono text-[11px] z-10">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Endpoint:</span>
                <span className="text-zinc-300 font-semibold">GET /Post/get-reels</span>
              </div>
              <div className="flex flex-col gap-0.5 text-zinc-500">
                <span>Target API:</span>
                <span className="text-sky-400 break-all select-all font-medium mt-0.5">{apiUrl}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 rounded-xl font-semibold text-sm hover:opacity-95 active:scale-95 transition-all text-white cursor-pointer z-10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State (Initial load returned 0 posts)
  if (reelsList.length === 0) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <div className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-900 p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 mx-auto">
            <Film className="w-8 h-8 text-zinc-500" />
          </div>

          <h2 className="text-xl font-bold mb-2 tracking-tight">No Media Found</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            The API returned an empty list. Upload some Reels first or seed the database.
          </p>

          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-xl font-semibold text-sm active:scale-95 transition-all text-white cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>
        </div>
      </div>
    );
  }

  // Normal Explore grid layout
  return (
    <div className="w-full min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Explore Grid */}
        <ExploreGrid
          reels={reelsList}
          onReelClick={handleReelClick}
          loadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isFetching}
        />
      </div>

      {/* Reel detailed modal overlay */}
      {selectedReel && (
        <ExploreReelModal
          isOpen={!!selectedReel}
          onClose={handleCloseModal}
          reel={selectedReel}
        />
      )}
    </div>
  );
}
