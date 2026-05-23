"use client";

import React, { useState } from "react";
import StoriesBar from "@/components/feed/StoriesBar";
import FeedList from "@/components/feed/FeedList";
import Suggestions from "@/components/feed/Suggestions";
import PostDetailModal from "@/components/feed/PostDetailModal";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeFeed() {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-ig-bg text-ig-fg transition-colors duration-300 w-full">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-ig-border bg-ig-bg/85 backdrop-blur-md sticky top-0 z-40">
        <span className="font-bold font-serif text-xl tracking-wider">Instagram</span>
        <div className="flex items-center gap-4">
          {/* Custom icons could go here */}
        </div>
      </div>

      {/* Max-width 935px aligned with real Instagram desktop width */}
      <div className="max-w-[935px] mx-auto px-4 py-4 md:py-8 flex gap-8 justify-center">
        {/* Left Side: Feed Content (exactly 470px max-width like Instagram feed posts) */}
        <div className="w-full max-w-[470px] flex flex-col gap-6">
          {/* StoriesBar at the absolute top of the feed */}
          <StoriesBar />
          
          {/* FeedList containing main posts feed */}
          <FeedList onViewDetails={setSelectedPostId} />
        </div>

        {/* Right Side: Suggestions Column (Desktop only, exactly 320px width) */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-[80px]">
            <Suggestions />
          </div>
        </div>
      </div>

      {/* Detailed view Modal */}
      <AnimatePresence>
        {selectedPostId !== null && (
          <PostDetailModal 
            postId={selectedPostId} 
            onClose={() => setSelectedPostId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
