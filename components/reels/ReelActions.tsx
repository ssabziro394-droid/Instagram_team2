"use client";

import React from "react";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal
} from "lucide-react";

interface ReelActionsProps {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onSave: () => void;
  onMoreClick: () => void;
}

export default function ReelActions({
  likesCount,
  commentsCount,
  isLiked,
  isSaved,
  onLike,
  onCommentClick,
  onShareClick,
  onSave,
  onMoreClick,
}: ReelActionsProps) {
  return (
    <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-5 text-white">
      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md cursor-pointer"
        >
          <Heart
            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
              isLiked ? "text-red-500 fill-red-500" : "text-white"
            }`}
          />
        </button>
        <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md select-none">
          {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
        </span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCommentClick();
          }}
          className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
        </button>
        <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md select-none">
          {commentsCount}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShareClick();
          }}
          className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md cursor-pointer"
        >
          <Send className="w-6 h-6 transition-transform group-hover:scale-110" />
        </button>
        <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md select-none">
          Share
        </span>
      </div>

      {/* Save Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md cursor-pointer"
        >
          <Bookmark
            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
              isSaved ? "text-yellow-500 fill-yellow-500" : "text-white"
            }`}
          />
        </button>
        <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md select-none">
          {isSaved ? "Saved" : "Save"}
        </span>
      </div>

      {/* More options dots */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onMoreClick();
        }}
        className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white/80 hover:text-white mt-1 shadow-md cursor-pointer"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}
