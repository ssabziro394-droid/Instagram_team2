"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  MessageSquare,
  Smile
} from "lucide-react";
import { Reel, useLikePostMutation, useAddCommentMutation } from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ReelCardProps {
  reel: Reel;
  isActive: boolean; // True if this reel is currently centered/visible
}

export default function ReelCard({ reel, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const [showPlayStateIndicator, setShowPlayStateIndicator] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLikingLocal, setIsLikingLocal] = useState(false);

  // Local state for optimistic updates
  const [localLike, setLocalLike] = useState(reel.postLike);
  const [localLikeCount, setLocalLikeCount] = useState(reel.postLikeCount);
  const [localComments, setLocalComments] = useState(reel.comments || []);

  useEffect(() => {
    setLocalLike(reel.postLike);
    setLocalLikeCount(reel.postLikeCount);
    setLocalComments(reel.comments || []);
  }, [reel.postLike, reel.postLikeCount, reel.comments]);

  // Handle play/pause depending on isActive prop
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log("Auto-play prevented", err);
            setIsPlaying(false);
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }

    setShowPlayStateIndicator(true);
    const timer = setTimeout(() => setShowPlayStateIndicator(false), 600);
    return () => clearTimeout(timer);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering play/pause
    if (!videoRef.current) return;

    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);

    setShowMuteIndicator(true);
    const timer = setTimeout(() => setShowMuteIndicator(false), 800);
    return () => clearTimeout(timer);
  };

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const newLikeState = !localLike;
    setLocalLike(newLikeState);
    setLocalLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikingLocal(true);

    try {
      await likePost(reel.postId).unwrap();
    } catch (err) {
      setLocalLike(reel.postLike);
      setLocalLikeCount(reel.postLikeCount);
      console.error("Failed to like reel", err);
    } finally {
      setTimeout(() => setIsLikingLocal(false), 300);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const currentText = commentText;
    setCommentText("");

    const optimisticComment = {
      postCommentId: Date.now(), // Temp ID
      userId: "me",
      userName: "You",
      userImage: null,
      dateCommented: new Date().toISOString(),
      comment: currentText,
    };
    
    setLocalComments(prev => [...prev, optimisticComment]);

    try {
      await addComment({ postId: reel.postId, comment: currentText }).unwrap();
    } catch (err) {
      console.error("Failed to add comment to reel", err);
      setCommentText(currentText);
      setLocalComments(prev => prev.filter(c => c.postCommentId !== optimisticComment.postCommentId));
    }
  };

  const videoUrl = getFileUrl(reel.images, "reel");

  return (
    <div className="relative w-full max-w-[420px] aspect-[9/16] bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col group">
      
      {/* Video Container */}
      <div 
        className="relative flex-1 w-full h-full cursor-pointer bg-black"
        onClick={togglePlay}
        onDoubleClick={handleLike}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
        />

        {/* Video Double-Click Like Overlay */}
        <AnimatePresence>
          {isLikingLocal && localLike && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <Heart className="h-28 w-28 text-red-500 fill-red-500 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause state floating indicator */}
        <AnimatePresence>
          {showPlayStateIndicator && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.8, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <div className="bg-black/60 p-4 rounded-full text-white">
                {isPlaying ? <Play className="h-8 w-8 fill-white" /> : <Pause className="h-8 w-8 fill-white" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mute state floating indicator */}
        <AnimatePresence>
          {showMuteIndicator && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-full text-white pointer-events-none z-10"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Overlay Info (User, Caption) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
              <img
                src={getFileUrl(reel.userImage, "avatar")}
                alt={reel.userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFileUrl(null, "avatar");
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-zinc-100 hover:underline">
                {reel.userName || "anonymous"}
              </span>
              <span className="text-[10px] text-zinc-400">
                {formatRelativeTime(reel.datePublished)}
              </span>
            </div>
          </div>

          {reel.content && (
            <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
              {reel.content}
            </p>
          )}
        </div>

        {/* Sidebar Controls (Like, Comment, Mute) */}
        <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4.5 z-20">
          {/* Like */}
          <div className="flex flex-col items-center">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={cn(
                "p-3 rounded-full transition-all backdrop-blur-md shadow-lg",
                localLike 
                  ? "bg-red-500/20 text-red-500 border border-red-500/30" 
                  : "bg-black/40 text-white border border-white/10 hover:bg-black/60"
              )}
            >
              <Heart className={cn("h-5 w-5", localLike && "fill-red-500")} />
            </motion.button>
            <span className="text-[10px] font-medium text-zinc-300 mt-1 shadow-sm">
              {localLikeCount}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              className="p-3 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60 transition-all backdrop-blur-md shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <span className="text-[10px] font-medium text-zinc-300 mt-1 shadow-sm">
              {localComments.length || reel.commentCount}
            </span>
          </div>

          {/* Audio toggle */}
          <button 
            onClick={toggleMute}
            className="p-3 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60 transition-all backdrop-blur-md shadow-lg"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Reel Comments Sheet / Overlay Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 h-[70%] bg-zinc-950 border-t border-zinc-900 rounded-t-2xl z-30 flex flex-col shadow-2xl"
          >
            {/* Sheet Handle / Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-900">
              <span className="font-semibold text-sm">Comments</span>
              <button 
                onClick={() => setShowComments(false)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
              {localComments && localComments.length > 0 ? (
                localComments.map((comment) => (
                  <div key={comment.postCommentId} className="flex gap-2.5 items-start text-xs">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 flex-shrink-0">
                      <img
                        src={getFileUrl(comment.userImage, "avatar")}
                        alt={comment.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFileUrl(null, "avatar");
                        }}
                      />
                    </div>
                    <div className="flex-1 leading-normal">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-zinc-200 hover:underline">
                          {comment.userName.split("@")[0]}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {formatRelativeTime(comment.dateCommented)}
                        </span>
                      </div>
                      <p className="text-zinc-300">{comment.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <span>No comments yet.</span>
                  <span>Be the first to share your thoughts!</span>
                </div>
              )}
            </div>

            {/* Comments input form */}
            <form 
              onSubmit={handleAddComment}
              className="p-3 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2"
            >
              <button type="button" className="text-zinc-400 hover:text-white p-1">
                <Smile className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className={cn(
                  "text-xs font-semibold px-2 py-1",
                  commentText.trim() 
                    ? "text-sky-500 hover:text-sky-400 cursor-pointer" 
                    : "text-sky-900 cursor-default"
                )}
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
