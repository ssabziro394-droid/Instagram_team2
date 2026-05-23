"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Smile 
} from "lucide-react";
import { useGetPostByIdQuery, useLikePostMutation, useAddCommentMutation } from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PostDetailModalProps {
  postId: number;
  onClose: () => void;
}

export default function PostDetailModal({ postId, onClose }: PostDetailModalProps) {
  const { data, isLoading, error } = useGetPostByIdQuery(postId);
  const [likePost] = useLikePostMutation();
  const [addComment] = useAddCommentMutation();
  
  const [commentText, setCommentText] = useState("");
  const post = data?.data;

  // Local state for optimistic likes
  const [localLike, setLocalLike] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);

  React.useEffect(() => {
    if (post) {
      setLocalLike(post.postLike);
      setLocalLikeCount(post.postLikeCount);
    }
  }, [post]);

  const handleLike = async () => {
    if (!post) return;
    const newLikeState = !localLike;
    setLocalLike(newLikeState);
    setLocalLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await likePost(post.postId).unwrap();
    } catch (err) {
      setLocalLike(post.postLike);
      setLocalLikeCount(post.postLikeCount);
      console.error("Failed to like post in detail modal", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    const currentText = commentText;
    setCommentText("");

    try {
      await addComment({ postId: post.postId, comment: currentText }).unwrap();
    } catch (err) {
      console.error("Failed to add comment in detail modal", err);
      setCommentText(currentText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Close button outside modal */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-zinc-950 border border-zinc-900 w-full max-w-4xl h-[85vh] max-h-[700px] rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        {isLoading ? (
          <div className="flex-1 h-full flex items-center justify-center text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : error || !post ? (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <span className="text-red-500 font-semibold mb-2">Error loading post details</span>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Left side: Image */}
            <div className="flex-1 bg-black flex items-center justify-center border-r border-zinc-900">
              <img
                src={getFileUrl(post.images?.[0], "post")}
                alt={post.title || "Post Image"}
                className="max-h-[45vh] md:max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* Right side: Comments & Actions */}
            <div className="w-full md:w-[380px] h-full flex flex-col bg-zinc-950">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-zinc-900">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-850 bg-zinc-900">
                  <img
                    src={getFileUrl(post.userImage, "avatar")}
                    alt={post.userName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFileUrl(null, "avatar");
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-zinc-100 hover:underline cursor-pointer">
                    {post.userName || "anonymous"}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatRelativeTime(post.datePublished)}
                  </span>
                </div>
              </div>

              {/* Caption & Comments List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 border-b border-zinc-900">
                {/* Caption */}
                {post.content && (
                  <div className="flex gap-2.5 items-start text-xs border-b border-zinc-900/50 pb-3">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-850 bg-zinc-900 flex-shrink-0">
                      <img
                        src={getFileUrl(post.userImage, "avatar")}
                        alt={post.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFileUrl(null, "avatar");
                        }}
                      />
                    </div>
                    <div className="flex-1 leading-normal">
                      <span className="font-semibold mr-1.5 text-zinc-100 hover:underline">
                        {post.userName}
                      </span>
                      <span className="text-zinc-200">{post.content}</span>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.postCommentId} className="flex gap-2.5 items-start text-xs">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-850 bg-zinc-900 flex-shrink-0">
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
                          <span className="font-semibold text-zinc-100 hover:underline">
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
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs py-8">
                    <span>No comments yet.</span>
                    <span>Start the conversation.</span>
                  </div>
                )}
              </div>

              {/* Actions & Likes */}
              <div className="p-4 border-b border-zinc-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleLike}
                      className={cn(
                        "transition-colors p-1 -m-1",
                        localLike ? "text-red-500" : "text-zinc-200 hover:text-zinc-400"
                      )}
                    >
                      <Heart className={cn("h-6 w-6", localLike && "fill-red-500")} />
                    </button>
                    <button className="text-zinc-200 hover:text-zinc-400 transition-colors p-1 -m-1">
                      <MessageCircle className="h-6 w-6" />
                    </button>
                    <button className="text-zinc-200 hover:text-zinc-400 transition-colors p-1 -m-1">
                      <Send className="h-6 w-6" />
                    </button>
                  </div>
                  <button className="text-zinc-200 hover:text-zinc-400 transition-colors p-1 -m-1">
                    <Bookmark className="h-6 w-6" />
                  </button>
                </div>
                <div className="font-semibold text-xs text-zinc-200 mb-1">
                  {localLikeCount} likes
                </div>
                <div className="text-[10px] text-zinc-500 uppercase">
                  {new Date(post.datePublished).toLocaleDateString()}
                </div>
              </div>

              {/* Comment Input */}
              <form 
                onSubmit={handleAddComment}
                className="p-3 bg-zinc-950 flex items-center gap-2"
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
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
