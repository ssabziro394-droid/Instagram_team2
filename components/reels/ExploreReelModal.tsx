"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reel } from "./types";
import {
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
} from "@/store/api/reelsApi";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetMyProfileQuery,
} from "@/store/api/profileApi";
import { MOCK_COMMENTS } from "./mockData";
import ExploreShareModal from "./ExploreShareModal";
import Link from "next/link";

interface ExploreReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
}

export default function ExploreReelModal({
  isOpen,
  onClose,
  reel: initialReel,
}: ExploreReelModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showOverlayIcon, setShowOverlayIcon] = useState<"play" | "pause" | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch latest post state (for real-time likes, saves, comments) from backend
  const { data: latestPost, refetch: refetchPost } = useGetPostByIdQuery(
    { postId: initialReel.id },
    { skip: !initialReel.id, refetchOnMountOrArgChange: true }
  );

  // Get current user profile (to verify comment authorship for deletion)
  const { data: myProfile } = useGetMyProfileQuery();

  // Mutations
  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [addPostFavorite] = useAddPostFavoriteMutation();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Combine initial/latest reel states
  const reel = latestPost || initialReel;

  // Use backend comments if available, fallback to mock comments
  const comments = reel.comments && reel.comments.length > 0 ? reel.comments : MOCK_COMMENTS;

  // Manage video autoplay and play state
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch((err) => console.log("Autoplay blocked in modal: ", err));
      }
    } else {
      setIsPlaying(false);
      videoRef.current?.pause();
    }
  }, [isOpen, reel.videoUrl]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!isOpen) return null;

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowOverlayIcon("pause");
    } else {
      video.play().catch((err) => console.log(err));
      setIsPlaying(true);
      setShowOverlayIcon("play");
    }

    setTimeout(() => {
      setShowOverlayIcon(null);
    }, 600);
  };

  const handleDoubleTapLike = () => {
    if (!reel.isLiked) {
      handleLike();
    }
    setShowHeartPop(true);
    setTimeout(() => {
      setShowHeartPop(false);
    }, 800);
  };

  const handleLike = async () => {
    try {
      await likePost({ postId: reel.id }).unwrap();
      refetchPost();
    } catch (err) {
      console.error("Failed to like post: ", err);
    }
  };

  const handleSave = async () => {
    try {
      await addPostFavorite({ postId: reel.id }).unwrap();
      refetchPost();
    } catch (err) {
      console.error("Failed to save post: ", err);
    }
  };

  const handleFollowToggle = async () => {
    const creatorId = reel.creator.id;
    if (!creatorId) return;

    try {
      if (reel.creator.isFollowing) {
        await unfollowUser({ followingUserId: creatorId }).unwrap();
      } else {
        await followUser({ followingUserId: creatorId }).unwrap();
      }
      refetchPost();
    } catch (err) {
      console.error("Failed to toggle follow status: ", err);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const currentText = commentText;
    setCommentText("");

    try {
      await addComment({ postId: reel.id, commentText: currentText }).unwrap();
      refetchPost();
    } catch (err) {
      console.error("Failed to add comment: ", err);
    }
  };

  const handleDeleteCommentSubmit = async (commentId: string) => {
    try {
      await deleteComment({ commentId, postId: reel.id }).unwrap();
      refetchPost();
    } catch (err) {
      console.error("Failed to delete comment: ", err);
    }
  };

  const appendEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const isCommentOwner = (commentUsername: string) => {
    if (!myProfile) return false;
    const currentUsername = myProfile.username || myProfile.userName || "";
    return currentUsername.toLowerCase() === commentUsername.toLowerCase();
  };

  const popularEmojis = ["❤️", "🙌", "🔥", "👏", "😂", "😍", "😢", "😮"];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 sm:p-6 md:p-10">
        {/* Backdrop Close Zone */}
        <div className="absolute inset-0 cursor-default" onClick={onClose} />

        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] p-2 rounded-full bg-black/40 hover:bg-black/75 text-zinc-300 hover:text-white transition-all active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Main Panel */}
        <div className="relative w-full max-w-4xl h-[85vh] md:h-[650px] lg:h-[750px] bg-black text-white flex flex-col md:flex-row rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 z-55">
          
          {/* LEFT SIDE: Media Player */}
          <div className="relative w-full md:w-3/5 h-[40vh] md:h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
            <div
              className="w-full h-full cursor-pointer flex items-center justify-center"
              onClick={handleVideoClick}
              onDoubleClick={handleDoubleTapLike}
            >
              <video
                ref={videoRef}
                src={reel.videoUrl || undefined}
                loop
                playsInline
                className="w-full h-full object-contain"
                preload="auto"
              />
            </div>

            {/* Giant Heart Pop on double tap */}
            <AnimatePresence>
              {showHeartPop && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 m-auto w-20 h-20 pointer-events-none z-30 flex items-center justify-center"
                >
                  <Heart className="w-20 h-20 text-red-500 fill-red-500 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play/Pause Overlay flash icon */}
            <AnimatePresence>
              {showOverlayIcon && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 m-auto w-14 h-14 pointer-events-none z-30 flex items-center justify-center bg-black/50 rounded-full"
                >
                  {showOverlayIcon === "play" ? (
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  ) : (
                    <Pause className="w-6 h-6 text-white fill-white" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mute Button Overlay */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white transition-all active:scale-95 shadow-md border border-zinc-800/30"
            >
              {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* RIGHT SIDE: Sidebar (Details, Comments, Actions) */}
          <div className="w-full md:w-2/5 flex flex-col h-[45vh] md:h-full bg-[#121212] border-t md:border-t-0 md:border-l border-zinc-850">
            {/* Header: Creator details & Follow */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-850">
              <div className="flex items-center gap-3">
                <Link href={`/${reel.creator.username}`} onClick={onClose}>
                  <img
                    src={reel.creator.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${reel.creator.username}`}
                    alt={reel.creator.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700 hover:opacity-85 transition-opacity"
                  />
                </Link>
                <div className="flex flex-col">
                  <Link
                    href={`/${reel.creator.username}`}
                    onClick={onClose}
                    className="font-bold text-sm text-zinc-150 hover:text-white transition-colors"
                  >
                    @{reel.creator.username}
                  </Link>
                  <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[140px]">
                    {reel.audioName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {reel.creator.id && (
                  <button
                    onClick={handleFollowToggle}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all ${
                      reel.creator.isFollowing
                        ? "bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/60"
                        : "bg-sky-500 hover:bg-sky-650 text-white font-bold"
                    }`}
                  >
                    {reel.creator.isFollowing ? "Following" : "Follow"}
                  </button>
                )}
                <button className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {/* Caption displays as the first pinned item */}
              <div className="flex items-start gap-3 border-b border-zinc-850/50 pb-4">
                <img
                  src={reel.creator.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${reel.creator.username}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm">
                    <span className="font-bold mr-1.5">@{reel.creator.username}</span>
                    <span className="text-zinc-200 leading-relaxed break-words">{reel.caption}</span>
                  </p>
                  <span className="text-[10px] text-zinc-500 mt-0.5">Author</span>
                </div>
              </div>

              {/* Comments Feed */}
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.username}`}
                      alt={comment.username}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                    />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm">
                        <span className="font-bold mr-1.5 text-zinc-200">@{comment.username}</span>
                        <span className="text-zinc-300 break-words">{comment.text}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                        <span>{comment.timestamp}</span>
                        {comment.likesCount > 0 && (
                          <span>{comment.likesCount} {comment.likesCount === 1 ? "like" : "likes"}</span>
                        )}
                        {isCommentOwner(comment.username) && (
                          <button
                            onClick={() => handleDeleteCommentSubmit(comment.id)}
                            className="text-red-500/80 hover:text-red-500 flex items-center gap-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comment Like Heart */}
                  <button className="text-zinc-500 hover:text-red-500 p-1">
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Emojis Selection Bar */}
            <div className="flex items-center gap-2 px-4 py-1.5 border-t border-zinc-850 bg-zinc-950/20 overflow-x-auto scrollbar-none">
              {popularEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => appendEmoji(emoji)}
                  className="text-lg hover:scale-125 transition-transform active:scale-95 py-0.5 px-1 bg-transparent border-0 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Interactive Actions Overlay */}
            <div className="p-4 border-t border-zinc-850 bg-[#121212] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className="p-1 -ml-1 rounded-full text-zinc-300 hover:text-red-500 transition-colors active:scale-90"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        reel.isLiked ? "text-red-500 fill-red-500 filter drop-shadow-sm" : ""
                      }`}
                    />
                  </button>

                  {/* Comment Bubble */}
                  <button
                    onClick={() => inputRef.current?.focus()}
                    className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors active:scale-90"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>

                {/* Bookmark/Save button */}
                <button
                  onClick={handleSave}
                  className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors active:scale-90"
                >
                  <Bookmark
                    className={`w-6 h-6 ${reel.isSaved ? "text-white fill-white" : ""}`}
                  />
                </button>
              </div>

              {/* Likes Count details */}
              <span className="font-bold text-sm tracking-tight text-zinc-200">
                {reel.likesCount.toLocaleString()} likes
              </span>

              {/* Date stamp */}
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </span>
            </div>

            {/* Comment Submission Form */}
            <form
              onSubmit={handleAddCommentSubmit}
              className="flex items-center justify-between p-3 border-t border-zinc-850 bg-zinc-950"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent text-sm placeholder-zinc-500 focus:outline-none text-white px-2 py-1"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className={`text-sm font-bold px-2 py-1 select-none transition-opacity ${
                  commentText.trim()
                    ? "text-sky-500 hover:text-sky-400 cursor-pointer"
                    : "text-zinc-650 cursor-default opacity-50"
                }`}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Share Sub-Modal */}
      <ExploreShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reel={reel}
      />
    </>
  );
}
