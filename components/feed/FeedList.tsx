"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGetFeedQuery } from "@/store/api/feedApi";
import PostCard from "./PostCard";
import { RefreshCw, PlusCircle } from "lucide-react";

export default function FeedList() {
  const [page, setPage] = useState(1);
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

  if (isLoading) {
    // Beautiful Instagram Post Skeleton Skeletons
    return (
      <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-zinc-800 rounded-2xl bg-zinc-950/50 backdrop-blur text-center max-w-lg mx-auto my-12">
        <span className="text-red-500 font-medium mb-2">Failed to load posts</span>
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

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 max-w-lg mx-auto my-12">
        <PlusCircle className="h-10 w-10 text-zinc-600 mb-4" />
        <h3 className="font-semibold text-zinc-300 mb-1">No posts found</h3>
        <p className="text-zinc-500 text-xs max-w-xs mb-6">
          The global feed is empty right now. Create your own posts or search for profiles to follow.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-10">
      {/* Posts List */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.postId} post={post} />
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
          
          <span className="text-xs text-zinc-500">
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
