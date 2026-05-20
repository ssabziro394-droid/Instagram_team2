"use client";

import React, { useState } from "react";
import StoriesBar from "@/components/feed/StoriesBar";
import FeedList from "@/components/feed/FeedList";
import ReelsList from "@/components/feed/ReelsList";
import Suggestions from "@/components/feed/Suggestions";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomeFeed() {
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");

  return (
    <div className="min-h-screen bg-black text-white w-full">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/85 backdrop-blur-md sticky top-0 z-40">
        <span className="font-bold font-serif text-xl tracking-wider">Instagram</span>
        <div className="flex items-center gap-4">
          {/* Add create post icons or messages shortcut here if needed */}
        </div>
      </div>

      <div className="max-w-[1010px] mx-auto px-4 py-4 md:py-8 flex gap-8 justify-center">
        {/* Left Side: Feed Content */}
        <div className="w-full max-w-lg flex flex-col gap-4">
          
          {/* Tab Switcher - Styled like a premium glassmorphic pill */}
          <div className="flex p-1 bg-zinc-950/70 border border-zinc-900/60 rounded-xl backdrop-blur-md sticky top-14 md:top-0 z-30 mb-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                activeTab === "posts" 
                  ? "bg-zinc-900 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Rss className="h-3.5 w-3.5" />
              For You
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                activeTab === "reels" 
                  ? "bg-zinc-900 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Film className="h-3.5 w-3.5" />
              Reels Feed
            </button>
          </div>

          {/* Conditional Content Rendering with Transitions */}
          <div>
            <AnimatePresence mode="wait">
              {activeTab === "posts" ? (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4"
                >
                  {/* Stories Bar */}
                  <StoriesBar />
                  
                  {/* Posts Feed */}
                  <FeedList />
                </motion.div>
              ) : (
                <motion.div
                  key="reels"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center"
                >
                  {/* Reels Vertical Scroll Snap Feed */}
                  <ReelsList />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Suggestions Column (Desktop only) */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <Suggestions />
          </div>
        </div>
      </div>
    </div>
  );
}
