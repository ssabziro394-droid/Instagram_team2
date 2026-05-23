"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reel } from "../types";
import CommentsSheet from "./CommentsSheet";
import ShareSheet from "./ShareSheet";
import MoreMenuSheet from "./MoreMenuSheet";
import { Comment } from "../types";
import Link from "next/link";

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onToggleFollow: (username: string) => void;
  comments: Comment[];
  onAddComment: (reelId: string, text: string) => void;
  onVideoEnded?: () => void;
  isAutoScrollActive: boolean;
}

export default function ReelCard({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onLike,
  onSave,
  onToggleFollow,
  comments,
  onAddComment,
  onVideoEnded,
  isAutoScrollActive
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showPlayStateOverlay, setShowPlayStateOverlay] = useState<"play" | "pause" | null>(null);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Play or pause based on active status and visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented:", error);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Manage volume state change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Click on video to play/pause
  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayStateOverlay("pause");
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setShowPlayStateOverlay("play");
      }).catch(err => console.log(err));
    }

    setTimeout(() => {
      setShowPlayStateOverlay(null);
    }, 600);
  };

  // Double click/tap to like
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reel.isLiked) {
      onLike(reel.id);
    }
    setShowHeartPop(true);
    setTimeout(() => {
      setShowHeartPop(false);
    }, 800);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareOpen(true);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMoreOpen(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex-shrink-0 snap-start relative bg-black flex justify-center items-center overflow-hidden"
      style={{ contentVisibility: "auto" }}
    >
      {/* 9:16 Aspect Ratio Cinematic Container */}
      <div className={`relative w-full h-full bg-black overflow-hidden shadow-2xl transition-all duration-500 ${
        isFullscreen ? "md:max-w-none shadow-none" : "md:max-w-[460px] md:rounded-xl md:border md:border-zinc-900/50"
      }`}>
        
        {/* Video Player Background */}
        <div 
          className="absolute inset-0 w-full h-full cursor-pointer z-0 bg-black"
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        >
          <video
            ref={videoRef}
            src={reel.videoUrl}
            loop={!isAutoScrollActive}
            onEnded={() => {
              if (isAutoScrollActive && onVideoEnded) {
                onVideoEnded();
              }
            }}
            onLoadedData={() => setIsVideoLoading(false)}
            onWaiting={() => setIsVideoLoading(true)}
            onPlaying={() => setIsVideoLoading(false)}
            onLoadStart={() => setIsVideoLoading(true)}
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
            preload="metadata"
          />

          {/* Inner Video Loading Overlay */}
          {isVideoLoading && (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-20">
              <div className="relative flex items-center justify-center">
                {/* Premium Instagram-style gradient spinner */}
                <div className="w-12 h-12 rounded-full border-[3px] border-zinc-800 border-t-pink-500 border-r-purple-650 border-b-yellow-500 animate-spin" />
              </div>
            </div>
          )}

          {/* Bottom Dark Gradient Shadow for Readability */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/45 to-transparent pointer-events-none z-10" />

          {/* Top Dark Gradient Shadow */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/75 to-transparent pointer-events-none z-10" />
        </div>

        {/* Global Sound Control Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-all active:scale-95 shadow-md"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Double-tap Giant Heart Pop Animation */}
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 m-auto w-24 h-24 pointer-events-none z-30 flex items-center justify-center"
            >
              <Heart className="w-24 h-24 text-red-500 fill-red-500 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Overlay Flash */}
        <AnimatePresence>
          {showPlayStateOverlay && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 m-auto w-16 h-16 pointer-events-none z-30 flex items-center justify-center bg-black/50 rounded-full"
            >
              {showPlayStateOverlay === "play" ? (
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 text-white fill-white" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Action Sidebar */}
        <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-5 text-white">
          {/* Like Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(reel.id);
              }}
              className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md"
            >
              <Heart
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  reel.isLiked ? "text-red-500 fill-red-500" : "text-white"
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md">
              {reel.likesCount >= 1000 ? `${(reel.likesCount / 1000).toFixed(1)}k` : reel.likesCount}
            </span>
          </div>

          {/* Comment Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCommentsOpen(true);
              }}
              className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md"
            >
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
            <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md">
              {comments.length}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShareClick}
              className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md"
            >
              <Send className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
            <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md">
              Share
            </span>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(reel.id);
              }}
              className="group p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all active:scale-90 shadow-md"
            >
              <Bookmark
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                  reel.isSaved ? "text-yellow-500 fill-yellow-500" : "text-white"
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-zinc-200 tracking-wide drop-shadow-md">
              {reel.isSaved ? "Saved" : "Save"}
            </span>
          </div>

          {/* More options dots */}
          <button 
            onClick={handleMoreClick}
            className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white/80 hover:text-white mt-1 shadow-md"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute left-4 right-16 bottom-6 z-30 text-white flex flex-col gap-3 pointer-events-none">
          {/* Creator Profile row */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <img
              src={reel.creator.avatarUrl}
              alt={reel.creator.username}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shadow-md"
            />
            <span className="font-semibold text-sm drop-shadow-md">@{reel.creator.username}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(reel.creator.username);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all active:scale-95 ${
                reel.creator.isFollowing
                  ? "bg-zinc-800/85 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                  : "bg-sky-500 hover:bg-sky-600 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
              }`}
            >
              {reel.creator.isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Caption */}
          <div className="text-sm leading-relaxed max-w-[95%] pointer-events-auto">
            <p className="inline drop-shadow-md text-zinc-200">
              {isCaptionExpanded
                ? reel.caption
                : reel.caption.length > 80
                ? `${reel.caption.substring(0, 80)}...`
                : reel.caption}
            </p>
            {reel.caption.length > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCaptionExpanded(!isCaptionExpanded);
                }}
                className="text-xs font-bold text-zinc-300 ml-1.5 hover:underline focus:outline-none"
              >
                {isCaptionExpanded ? "less" : "more"}
              </button>
            )}
          </div>

          {/* Audio track & music disc */}
          <div className="flex items-center gap-2 mt-1 pointer-events-auto">
            <Link 
              href={`/idiboy/reels/audio/${encodeURIComponent(reel.audioName)}`} 
              className="flex items-center gap-2 hover:opacity-80 transition-all pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                <Music className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              {/* Scrolling track effect */}
              <div className="w-40 overflow-hidden text-xs text-zinc-300 font-medium whitespace-nowrap mask-gradient select-none">
                <div className="inline-block animate-marquee drop-shadow-sm">
                  {reel.audioName}
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Floating Rotating Vinyl Disc */}
        <div className="absolute right-4 bottom-6 z-30 pointer-events-auto">
          <Link href={`/idiboy/reels/audio/${encodeURIComponent(reel.audioName)}`} onClick={(e) => e.stopPropagation()}>
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={isPlaying ? { repeat: Infinity, duration: 4, ease: "linear" } : {}}
              className="w-9 h-9 rounded-full bg-zinc-900 border-2 border-zinc-700/50 flex items-center justify-center shadow-lg relative overflow-hidden"
            >
              <img
                src={reel.creator.avatarUrl}
                alt="audio artwork"
                className="w-5 h-5 rounded-full object-cover"
              />
              <div className="absolute w-1.5 h-1.5 bg-zinc-950 rounded-full border border-zinc-800 inset-0 m-auto" />
            </motion.div>
          </Link>
        </div>

        {/* Comments Bottom Sheet Drawer */}
        <CommentsSheet
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          reelId={reel.id}
          comments={comments}
          onAddComment={(text) => onAddComment(reel.id, text)}
        />

        {/* Share Bottom Sheet Drawer */}
        <ShareSheet
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          reelId={reel.id}
        />

        {/* More Menu Bottom Sheet Drawer */}
        <MoreMenuSheet
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          reelId={reel.id}
          isSaved={reel.isSaved}
          onSave={() => onSave(reel.id)}
          onToggleFullscreen={toggleFullscreen}
          onToggleAutoScroll={onToggleMute}
          isFullscreenActive={isFullscreen}
          isAutoScrollActive={isAutoScrollActive}
        />
      </div>
    </div>
  );
}

