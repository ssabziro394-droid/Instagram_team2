"use client";

import React from "react";
import { Plus } from "lucide-react";

// Mock stories data for rich presentation
const MOCK_STORIES = [
  { id: 1, name: "your_story", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", isOwn: true },
  { id: 2, name: "rakh1movl6", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: 3, name: "tom11", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
  { id: 4, name: "yahyo", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: 5, name: "ismoilcha", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
  { id: 6, name: "yusuf09", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
  { id: 7, name: "softclub", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" },
];

export default function StoriesBar() {
  return (
    <div className="flex gap-4 overflow-x-auto py-2.5 px-1 scrollbar-none w-full border-b border-zinc-900 mb-2">
      {MOCK_STORIES.map((story) => (
        <div key={story.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
          {/* Avatar Ring */}
          <div className="relative">
            {story.isOwn ? (
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white fill-white" />
                </div>
              </div>
            ) : (
              <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full rounded-full p-[2px] bg-black">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Story Username */}
          <span className="text-[10px] text-zinc-400 mt-1.5 max-w-[66px] truncate text-center group-hover:text-zinc-200 transition-colors">
            {story.isOwn ? "Your Story" : story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
