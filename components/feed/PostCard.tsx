"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Smile 
} from "lucide-react";
import { Post, useLikePostMutation, useAddCommentMutation, useAddPostFavoriteMutation } from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onViewDetails?: (postId: number) => void;
}

export default function PostCard({ post, onViewDetails }: PostCardProps) {
  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();
  const [addFavorite] = useAddPostFavoriteMutation();
  
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [isLikingLocal, setIsLikingLocal] = useState(false);

  // Local state for optimistic updates
  const [localLike, setLocalLike] = useState(post.postLike);
  const [localLikeCount, setLocalLikeCount] = useState(post.postLikeCount);
  const [localFavorite, setLocalFavorite] = useState(post.postFavorite || false);
  const [localComments, setLocalComments] = useState(post.comments || []);

  // Sync with prop updates
  React.useEffect(() => {
    setLocalLike(post.postLike);
    setLocalLikeCount(post.postLikeCount);
    setLocalFavorite(post.postFavorite || false);
    setLocalComments(post.comments || []);
  }, [post.postLike, post.postLikeCount, post.comments]);

  const handleLike = async () => {
    // Optimistic UI update
    const newLikeState = !localLike;
    setLocalLike(newLikeState);
    setLocalLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikingLocal(true);

    try {
      await likePost(post.postId).unwrap();
    } catch (err) {
      // Revert if API fails
      setLocalLike(post.postLike);
      setLocalLikeCount(post.postLikeCount);
      console.error("Failed to like post", err);
    } finally {
      setTimeout(() => setIsLikingLocal(false), 300);
    }
  };

  const handleFavorite = async () => {
    const newFavState = !localFavorite;
    setLocalFavorite(newFavState);
    
    try {
      await addFavorite({ postId: post.postId }).unwrap();
    } catch (err) {
      setLocalFavorite(post.postFavorite || false);
      console.error("Failed to favorite post", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const currentText = commentText;
    setCommentText("");

    // Optimistic comment update
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
      await addComment({ postId: post.postId, comment: currentText }).unwrap();
    } catch (err) {
      console.error("Failed to add comment", err);
      // Restore text and remove optimistic comment if failed
      setCommentText(currentText);
      setLocalComments(prev => prev.filter(c => c.postCommentId !== optimisticComment.postCommentId));
    }
  };

  const visibleComments = showAllComments 
    ? localComments 
    : localComments?.slice(0, 3) || [];

  const mediaUrl = getFileUrl(post.images?.[0], "post");
  const rawFilename = post.images?.[0] ?? "";
  const isVideo = [".mp4", ".webm", ".mov", ".avi", ".mkv"].some((ext) => rawFilename.toLowerCase().endsWith(ext));

  return (
    <article className="bg-ig-bg border border-ig-border rounded-xl overflow-hidden mb-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-ig-border bg-ig-card-bg">
            <img
              src={getFileUrl(post.userImage, "avatar")}
              alt={post.userName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = getFileUrl(null, "avatar");
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm hover:underline cursor-pointer">
                {post.userName || "anonymous"}
              </span>
              <span className="text-ig-secondary text-xs">•</span>
              <span className="text-ig-secondary text-xs">
                {formatRelativeTime(post.datePublished)}
              </span>
            </div>
            {post.title && (
              <p className="text-ig-secondary text-xs font-medium leading-none mt-0.5">
                {post.title}
              </p>
            )}
          </div>
        </div>
        <button className="text-ig-secondary hover:text-white transition-colors p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Media Image */}
      <div 
        className="relative w-full aspect-square bg-ig-card-bg overflow-hidden cursor-pointer"
        onDoubleClick={handleLike}
        onClick={() => onViewDetails?.(post.postId)}
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              // Fallback if video fails
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={post.title || "Post Image"}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        
        {/* Double click heart animation */}
        <AnimatePresence>
          {isLikingLocal && localLike && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="h-24 w-24 text-red-500 fill-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={cn(
                "transition-colors p-1 -m-1",
                localLike ? "text-red-500" : "text-ig-fg hover:text-zinc-400"
              )}
            >
              <Heart className={cn("h-6 w-6", localLike && "fill-red-500")} />
            </motion.button>
            <button 
              onClick={() => onViewDetails?.(post.postId)}
              className="text-ig-fg hover:text-zinc-400 transition-colors p-1 -m-1"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="text-ig-fg hover:text-zinc-400 transition-colors p-1 -m-1">
              <Send className="h-6 w-6" />
            </button>
          </div>
          <button 
            onClick={handleFavorite}
            className={cn(
              "transition-colors p-1 -m-1",
              localFavorite ? "text-yellow-500" : "text-ig-fg hover:text-ig-secondary"
            )}
          >
            <Bookmark className={cn("h-6 w-6", localFavorite && "fill-yellow-500")} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="font-semibold text-sm mb-1.5 text-ig-fg">
          {localLikeCount.toLocaleString()} {localLikeCount === 1 ? "like" : "likes"}
        </div>

        {/* Caption & Content */}
        {post.content && (
          <div className="text-sm leading-relaxed mb-2 text-ig-fg">
            <span className="font-semibold mr-2 text-ig-fg hover:underline cursor-pointer">
              {post.userName || "anonymous"}
            </span>
            {post.content}
          </div>
        )}

        {/* Comments section */}
        {post.comments && post.comments.length > 0 && (
          <div className="mt-2.5">
            {post.comments.length > 3 && (
              <button 
                onClick={() => onViewDetails ? onViewDetails(post.postId) : setShowAllComments(!showAllComments)}
                className="text-ig-secondary text-xs font-medium mb-2 hover:text-zinc-400 transition-colors"
              >
                {showAllComments 
                  ? "Hide comments" 
                  : `View all ${post.comments.length} comments`}
              </button>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {visibleComments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={comment.postCommentId} 
                    className="flex gap-2.5 items-start text-xs group"
                  >
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-ig-border bg-ig-card-bg flex-shrink-0 mt-0.5">
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
                      <span className="font-semibold mr-1.5 text-ig-fg hover:underline cursor-pointer">
                        {comment.userName.split("@")[0]}
                      </span>
                      <span className="text-ig-fg">{comment.comment}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-ig-secondary">
                        <span>{formatRelativeTime(comment.dateCommented)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Add Comment Input */}
      <form 
        onSubmit={handleAddComment}
        className="flex items-center gap-2.5 px-3.5 py-3 border-t border-ig-border bg-ig-bg"
      >
        <button type="button" className="text-ig-secondary hover:text-white transition-colors">
          <Smile className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-xs text-ig-fg placeholder-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className={cn(
            "text-xs font-semibold transition-colors pr-1",
            commentText.trim() 
              ? "text-sky-500 hover:text-sky-400 cursor-pointer" 
              : "text-sky-900 cursor-default"
          )}
        >
          Post
        </button>
      </form>
    </article>
  );
}
