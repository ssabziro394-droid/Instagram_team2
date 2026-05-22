  
  "use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Heart, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Comment } from "./types";
import { MOCK_COMMENTS } from "./mockData";

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reelId: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
}

// Translations map for localized premium feel
const TRANSLATIONS: Record<string, string> = {
  "c1": "@dodarbek_99 Did you understand? 😂",
  "c2": "There is no problem for me, let's ride till the end of time 👏😂",
  "c3": "Zone 🔥",
  "c4": "@kosimzoda_0007 🫣🫣",
  "c5": "@bobojonzoda_oo9 @_bobojonzoda_1331 😂😂",
  "r1": "Yes brother, we understood! Respect 👍"
};

export default function CommentsSheet({
  isOpen,
  onClose,
  reelId,
  comments,
  onAddComment,
}: CommentsSheetProps) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [translatedComments, setTranslatedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize and sync comments
  useEffect(() => {
    if (comments && comments.length > 0) {
      // Sync from parent if available, but preserve replies
      setLocalComments(prev => {
        const merged = [...comments];
        // Ensure mock comments replies are kept if we merged them
        return merged.map(c => {
          const existing = prev.find(p => p.id === c.id);
          if (existing && existing.replies && !c.replies) {
            return { ...c, replies: existing.replies };
          }
          return c;
        });
      });
    } else {
      setLocalComments(MOCK_COMMENTS);
    }
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const textToSubmit = newComment.trim();

    if (replyingTo) {
      // Handle nested reply locally
      const replyObj: Comment = {
        id: `reply-${Date.now()}`,
        username: "current_user",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=current_user",
        text: textToSubmit,
        timestamp: "1с",
        likesCount: 0,
        isLiked: false
      };

      setLocalComments(prev => 
        prev.map(c => {
          if (c.id === replyingTo.commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), replyObj]
            };
          }
          return c;
        })
      );
      
      // Auto expand replies for this comment
      setExpandedComments(prev => ({
        ...prev,
        [replyingTo.commentId]: true
      }));

      // Notify parent to increment comments count
      onAddComment(textToSubmit);
      setReplyingTo(null);
    } else {
      // Handle normal main comment
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        username: "current_user",
        avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=current_user",
        text: textToSubmit,
        timestamp: "1с",
        likesCount: 0,
        isLiked: false,
        replies: []
      };

      setLocalComments(prev => [...prev, newCommentObj]);
      onAddComment(textToSubmit);
    }

    setNewComment("");

    // Scroll to bottom after adding comment
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleEmojiClick = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleLikeComment = (commentId: string, replyId?: string) => {
    setLocalComments(prev => 
      prev.map(c => {
        if (replyId) {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === replyId) {
                  const liked = !r.isLiked;
                  return {
                    ...r,
                    isLiked: liked,
                    likesCount: liked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1)
                  };
                }
                return r;
              })
            };
          }
        } else {
          if (c.id === commentId) {
            const liked = !c.isLiked;
            return {
              ...c,
              isLiked: liked,
              likesCount: liked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
            };
          }
        }
        return c;
      })
    );
  };

  const toggleTranslation = (commentId: string) => {
    setTranslatedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    setNewComment(`@${username} `);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const toggleExpandReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black z-40 cursor-pointer transition-opacity"
          />

          {/* Instagram Style bottom sheet drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute bottom-0 left-0 right-0 h-[65vh] rounded-t-[24px] bg-[#1c1c1e] border-t border-zinc-800/60 z-50 flex flex-col shadow-2xl overflow-hidden text-white"
          >
            {/* Visual Drag Handle Indicator */}
            <div className="w-full flex justify-center py-3.5 cursor-pointer select-none" onClick={onClose}>
              <div className="w-9 h-1.5 bg-[#444446] rounded-full" />
            </div>

            {/* Comments Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[#2c2c2e]">
              <div className="w-6" /> {/* spacer */}
              <h3 className="font-bold text-[15px] tracking-wide select-none">Comments</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-[#2c2c2e] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-none pb-4">
              {localComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                  <p className="text-sm font-semibold">No comments yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Be the first to share your thoughts!</p>
                </div>
              ) : (
                localComments.map((comment) => {
                  const hasReplies = comment.replies && comment.replies.length > 0;
                  const isRepliesExpanded = !!expandedComments[comment.id];
                  const isTranslated = !!translatedComments[comment.id];
                  const hasTranslation = !!TRANSLATIONS[comment.id];

                  return (
                    <div key={comment.id} className="flex flex-col">
                      {/* Main Comment Row */}
                      <div className="flex gap-3 text-sm items-start py-1">
                        {/* Avatar */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={comment.avatarUrl}
                          alt={comment.username}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-800 select-none"
                        />

                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[13px] text-zinc-150 hover:underline cursor-pointer">
                              {comment.username}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {comment.timestamp}
                            </span>
                            {comment.isAuthor && (
                              <span className="text-[10px] text-zinc-400 bg-[#2c2c2e] px-1.5 py-0.5 rounded-md font-semibold select-none">
                                • Автор
                              </span>
                            )}
                          </div>
                          
                          <p className="text-zinc-200 text-[13.5px] leading-relaxed mt-1 whitespace-pre-wrap break-words pr-2">
                            {isTranslated ? TRANSLATIONS[comment.id] : comment.text}
                          </p>
                          
                          {/* Actions Bar */}
                          <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-zinc-500">
                            <button 
                              onClick={() => handleReplyClick(comment.id, comment.username)}
                              className="hover:text-zinc-400 transition-colors cursor-pointer"
                            >
                              Ответить
                            </button>
                            
                            {hasTranslation && (
                              <button 
                                onClick={() => toggleTranslation(comment.id)}
                                className="hover:text-zinc-400 transition-colors cursor-pointer text-zinc-400/90"
                              >
                                {isTranslated ? "Показать оригинал" : "Показать перевод"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Heart Like Action (Right) */}
                        <div className="flex flex-col items-center justify-center pl-1 pt-1 select-none">
                          <button 
                            onClick={() => handleLikeComment(comment.id)}
                            className={`p-1.5 transition-all duration-100 ${
                              comment.isLiked 
                                ? "text-red-500 hover:text-red-600 scale-110 active:scale-90" 
                                : "text-zinc-500 hover:text-zinc-400 active:scale-95"
                            }`}
                          >
                            <Heart 
                              className={`w-3.5 h-3.5 ${comment.isLiked ? "fill-red-500" : ""}`} 
                            />
                          </button>
                          {comment.likesCount > 0 && (
                            <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                              {comment.likesCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nested Replies Section */}
                      {hasReplies && (
                        <div className="flex flex-col">
                          {/* Expanded replies container */}
                          {isRepliesExpanded && (
                            <div className="space-y-3 mt-2">
                              {comment.replies!.map((reply) => {
                                const isReplyTranslated = !!translatedComments[reply.id];
                                const hasReplyTranslation = !!TRANSLATIONS[reply.id];

                                return (
                                  <div key={reply.id} className="flex gap-2.5 pl-11 text-xs items-start py-0.5">
                                    {/* Small Avatar */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={reply.avatarUrl}
                                      alt={reply.username}
                                      className="w-6 h-6 rounded-full object-cover border border-zinc-850 select-none"
                                    />

                                    {/* Reply Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-[12px] text-zinc-150 hover:underline cursor-pointer">
                                          {reply.username}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-medium">
                                          {reply.timestamp}
                                        </span>
                                      </div>
                                      
                                      <p className="text-zinc-200 text-[12.5px] leading-relaxed mt-1 whitespace-pre-wrap break-words pr-2">
                                        {isReplyTranslated ? TRANSLATIONS[reply.id] : reply.text}
                                      </p>

                                      <div className="flex items-center gap-4 mt-1.5 text-[10.5px] font-semibold text-zinc-500">
                                        <button 
                                          onClick={() => handleReplyClick(comment.id, reply.username)}
                                          className="hover:text-zinc-400 transition-colors cursor-pointer"
                                        >
                                          Ответить
                                        </button>
                                        
                                        {hasReplyTranslation && (
                                          <button 
                                            onClick={() => toggleTranslation(reply.id)}
                                            className="hover:text-zinc-400 transition-colors cursor-pointer text-zinc-400/90"
                                          >
                                            {isReplyTranslated ? "Показать оригинал" : "Показать перевод"}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Reply Like Action (Right) */}
                                    <div className="flex flex-col items-center justify-center pl-1 select-none">
                                      <button 
                                        onClick={() => handleLikeComment(comment.id, reply.id)}
                                        className={`p-1.5 transition-all duration-100 ${
                                          reply.isLiked 
                                            ? "text-red-500 hover:text-red-600 scale-110 active:scale-90" 
                                            : "text-zinc-500 hover:text-zinc-400 active:scale-95"
                                        }`}
                                      >
                                        <Heart 
                                          className={`w-3 h-3 ${reply.isLiked ? "fill-red-500" : ""}`} 
                                        />
                                      </button>
                                      {reply.likesCount > 0 && (
                                        <span className="text-[9px] text-zinc-500 font-semibold">
                                          {reply.likesCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* "View More / Hide Replies" Row */}
                          <div 
                            onClick={() => toggleExpandReplies(comment.id)}
                            className="flex items-center gap-3 ml-11 mt-1 cursor-pointer select-none group py-1.5 w-fit"
                          >
                            <div className="w-6 h-[1px] bg-zinc-700 group-hover:bg-zinc-650 transition-colors" />
                            <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors">
                              {isRepliesExpanded 
                                ? "Скрыть ответы" 
                                : `Смотреть ещё ${comment.replies!.length} ${
                                    comment.replies!.length === 1 ? "ответ" : "ответа"
                                  }`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Replying Indicator banner */}
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#2c2c2e] text-xs text-zinc-400 border-t border-zinc-800">
                <span>Replying to @{replyingTo.username}</span>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-0.5 rounded-full hover:bg-zinc-700 text-zinc-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Emoji reaction bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#121212] border-t border-[#2c2c2e] select-none">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-[22px] hover:scale-120 active:scale-90 transition-transform duration-100 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Sticky Input Field Area */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-[#2c2c2e] p-3 bg-[#121212] flex gap-3 items-center sticky bottom-0 z-10"
            >
              {/* User avatar on the left */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=current_user"
                alt="user avatar"
                className="w-8 h-8 rounded-full object-cover select-none"
              />

              {/* Input field wrapper */}
              <div className="flex-1 relative flex items-center bg-[#262626] rounded-full px-4 py-2 border border-zinc-800/10 focus-within:border-zinc-700 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Что вы об этом думаете?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-transparent text-white text-[13.5px] focus:outline-none placeholder-zinc-500 pr-16"
                />

                {/* Right actions inside input bubble */}
                <div className="absolute right-3 flex items-center gap-2 select-none">
                  {newComment.trim() ? (
                    <button
                      type="submit"
                      className="text-sky-500 font-bold text-[13px] hover:text-sky-400 active:scale-95 transition-all cursor-pointer"
                    >
                      Опубликовать
                    </button>
                  ) : (
                    <>
                      {/* Media Image icon */}
                      <button 
                        type="button"
                        className="text-zinc-400 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        <Image className="w-[18px] h-[18px]" />
                      </button>
                      
                      {/* GIF badge button */}
                      <button
                        type="button"
                        className="text-[9px] font-extrabold text-zinc-300 border border-zinc-500/80 rounded px-1 py-0.5 hover:bg-zinc-800 transition-colors cursor-pointer uppercase select-none font-sans"
                      >
                        GIF
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
