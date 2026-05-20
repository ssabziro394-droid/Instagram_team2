"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGetFeedQuery } from "@/store/api/feedApi";
import PostCard from "./PostCard";
import { RefreshCw, PlusCircle, AlertCircle } from "lucide-react";

interface FeedListProps {
  onViewDetails?: (postId: number) => void;
}

export default function FeedList({ onViewDetails }: FeedListProps) {
  const [page, setPage] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useGetFeedQuery({
    pageNumber: page,
    pageSize: 10,
  });

  const posts = data?.data || [];
  const totalPages = data?.totalPage || 1;

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch().unwrap();
    } catch (err) {
      console.error("Feed refetch failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  // 1. Loading state (either initial load, background fetching, or manual retrying)
  if (isLoading || isFetching || isRetrying) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-lg mx-auto animate-fade-in">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 p-4">
              <div className="w-8 h-8 rounded-full bg-zinc-900"></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="w-24 h-3.5 bg-zinc-900 rounded"></div>
                <div className="w-16 h-2 bg-zinc-900 rounded"></div>
              </div>
            </div>
            {/* Media Skeleton */}
            <div className="w-full aspect-square bg-zinc-900"></div>
            {/* Footer Actions Skeleton */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded bg-zinc-900"></div>
                <div className="w-6 h-6 rounded bg-zinc-900"></div>
                <div className="w-6 h-6 rounded bg-zinc-900"></div>
              </div>
              <div className="w-20 h-4 bg-zinc-900 rounded"></div>
              <div className="w-48 h-3.5 bg-zinc-900 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Error state (user-friendly message + official Instagram blue accent retry button)
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto my-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center mb-6 shadow-md">
          <RefreshCw className="h-7 w-7 text-zinc-400 animate-pulse" />
        </div>
        <h3 className="font-semibold text-lg text-white mb-2 tracking-tight">Couldn't load feed</h3>
        <p className="text-zinc-500 text-xs max-w-xs mb-8 leading-relaxed">
          We're having trouble loading your Instagram feed. Please check your internet connection and try again.
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-xl duration-200"
        >
          Try again
        </button>
      </div>
    );
  }

  // 3. Empty state
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/20 max-w-lg mx-auto my-12 animate-fade-in">
        <PlusCircle className="h-10 w-10 text-zinc-650 mb-4" />
        <h3 className="font-semibold text-zinc-300 mb-1">No posts found</h3>
        <p className="text-zinc-500 text-xs max-w-xs mb-6 leading-relaxed">
          The global feed is empty right now. Create your own posts or search for profiles to follow.
        </p>
      </div>
    );
  }

  // 4. Success state
  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-10">
      {/* Posts List */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.postId} post={post} onViewDetails={onViewDetails} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={handlePrevPage}
            disabled={page === 1 || isFetching}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-medium rounded-lg text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            Previous
          </button>
          
          <span className="text-xs text-zinc-550">
            Page <span className="text-zinc-300 font-semibold">{page}</span> of {totalPages}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={page === totalPages || isFetching}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-medium rounded-lg text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
