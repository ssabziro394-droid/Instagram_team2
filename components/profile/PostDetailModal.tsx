"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Smile,
  User,
  MoreHorizontal,
} from "lucide-react";
import {
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useDeletePostMutation,
} from "@/store/api/postsApi";
import type { ProfilePost, UserProfile, PostComment } from "@/types/profile";

type PostDetailModalProps = {
  post: ProfilePost;
  currentUser?: UserProfile | null;
  onClose: () => void;
};

const API_BASE_URL = "https://instagram-api.softclub.tj";
const IMAGE_BASE_URL = `${API_BASE_URL}/images`;

function normalizeImageUrl(value?: string) {
  if (!value) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  const cleanValue = value.replace(/^\/+/, "");
  if (cleanValue.startsWith("images/")) {
    return `${API_BASE_URL}/${cleanValue}`;
  }

  return `${IMAGE_BASE_URL}/${cleanValue}`;
}

function isVideoUrl(url?: string) {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    cleanUrl.includes("/video") ||
    url.startsWith("blob:video/")
  );
}

function getAvatarUrl(profileImage?: string) {
  return normalizeImageUrl(profileImage);
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "1м";
    if (diffMins < 60) return `${diffMins}м`;
    if (diffHours < 24) return `${diffHours}ч`;
    if (diffDays < 7) return `${diffDays}д`;

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function PostDetailModal({
  post,
  currentUser,
  onClose,
}: PostDetailModalProps) {
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const [commentText, setCommentText] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});

  const [localIsLiked, setLocalIsLiked] = useState(post.postLike ?? false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount ?? post.likeCount ?? 0);
  const [localComments, setLocalComments] = useState<PostComment[]>(post.comments ?? []);
  const [localCommentsCount, setLocalCommentsCount] = useState(
    Array.isArray(post.comments) ? post.comments.length : (post.commentsCount ?? post.commentCount ?? 0)
  );

  useEffect(() => {
    setLocalIsLiked(post.postLike ?? false);
    setLocalLikesCount(post.likesCount ?? post.likeCount ?? 0);
    setLocalComments(post.comments ?? []);
    setLocalCommentsCount(
      Array.isArray(post.comments) ? post.comments.length : (post.commentsCount ?? post.commentCount ?? 0)
    );
  }, [post.postLike, post.likesCount, post.likeCount, post.comments, post.commentsCount, post.commentCount]);

  const toggleLikeComment = (commentId: number) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  // Extract all images associated with this post
  const images: string[] = [];
  if (post.mediaUrl || post.imageUrl) {
    images.push(post.mediaUrl || post.imageUrl || "");
  }
  
  const rawImages = post.images || post.Images || post.postImages || post.photos || [];
  if (Array.isArray(rawImages)) {
    rawImages.forEach((img) => {
      const url = typeof img === "string" ? img : img.imageUrl || img.url || img.image || img.path;
      if (url && !images.includes(url)) {
        images.push(url);
      }
    });
  }

  // Fallback to post.imageName if no images
  if (images.length === 0 && post.imageName) {
    images.push(post.imageName);
  }

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleLike = async () => {
    if (!post.postId) return;

    const nextIsLiked = !localIsLiked;
    setLocalIsLiked(nextIsLiked);
    setLocalLikesCount((prev) => Math.max(0, prev + (nextIsLiked ? 1 : -1)));

    try {
      await likePost(Number(post.postId)).unwrap();
    } catch (err) {
      console.error("Failed to like post:", err);
      // Revert on failure
      setLocalIsLiked(!nextIsLiked);
      setLocalLikesCount((prev) => Math.max(0, prev + (!nextIsLiked ? 1 : -1)));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post.postId) return;

    const trimmedComment = commentText.trim();
    setCommentText("");

    // Optimistic comment object
    const tempCommentId = Date.now();
    const newCommentObj: PostComment = {
      postCommentId: tempCommentId,
      userId: currentUser?.userId ?? currentUser?.id ?? "",
      userName: currentUser?.userName ?? currentUser?.username ?? "Вы",
      userImage: currentUser?.image ?? currentUser?.avatar ?? currentUser?.avatarUrl ?? "",
      comment: trimmedComment,
      dateCommented: new Date().toISOString(),
    };

    setLocalComments((prev) => [...prev, newCommentObj]);
    setLocalCommentsCount((prev) => prev + 1);

    // Scroll to bottom of comments list after adding
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      await addComment({
        comment: trimmedComment,
        postId: Number(post.postId),
      }).unwrap();
    } catch (err) {
      console.error("Failed to add comment:", err);
      // Revert on failure
      setLocalComments((prev) => prev.filter((c) => c.postCommentId !== tempCommentId));
      setLocalCommentsCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDeleteComment = async (commentId?: number) => {
    if (!commentId) return;

    // Optimistic delete
    setLocalComments((prev) => prev.filter((c) => c.postCommentId !== commentId));
    setLocalCommentsCount((prev) => Math.max(0, prev - 1));

    try {
      await deleteComment(commentId).unwrap();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      // Revert on failure
      setLocalComments(post.comments ?? []);
      setLocalCommentsCount(
        Array.isArray(post.comments) ? post.comments.length : (post.commentsCount ?? post.commentCount ?? 0)
      );
    }
  };

  const currentUserId = currentUser?.userId ?? currentUser?.id;

  const isMyPost = currentUser && (
    (post.userId !== undefined && String(post.userId) === String(currentUserId)) ||
    (post.userName !== undefined && String(post.userName).toLowerCase() === String(currentUser.username ?? currentUser.userName).toLowerCase())
  );

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("Вы уверены, что хотите удалить эту публикацию?");
    if (!confirmDelete) return;

    try {
      await deletePost(Number(post.postId || post.id)).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Не удалось удалить публикацию.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 md:p-10">
      {/* Outer Close Click Area */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Floating Close Button (Viewport Top-Right, Outside Modal Box) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex items-center justify-center rounded-full p-2 text-white/70 transition hover:bg-zinc-900/60 hover:text-white"
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Main Modal Box */}
      <div className="relative z-10 flex h-full max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-md border border-zinc-800 bg-black text-white shadow-2xl">
        
        {/* Left Side: Images Carousel */}
        <div className="relative flex flex-1 items-center justify-center bg-zinc-950/40 select-none">
          {images.length > 0 ? (
            <>
              {isVideoUrl(images[activeImageIndex]) ? (
                <video
                  src={normalizeImageUrl(images[activeImageIndex])}
                  controls
                  className="h-full w-full object-contain max-h-[85vh]"
                />
              ) : (
                <img
                  src={normalizeImageUrl(images[activeImageIndex])}
                  alt="Post content"
                  className="h-full w-full object-contain max-h-[85vh]"
                />
              )}

              {/* Tagged Person Icon (Bottom Left of the Image) */}
              <div className="absolute bottom-4 left-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 cursor-pointer transition hover:bg-black/85">
                <User className="h-4 w-4 text-white" />
              </div>

              {/* Slide Nav Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 rounded-full bg-black/55 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 rounded-full bg-black/55 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Slider Dots */}
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          idx === activeImageIndex ? "bg-white scale-125" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-sm text-zinc-500">Нет медиафайлов</div>
          )}
        </div>

        {/* Right Side: Header, Comments list, Actions, Form */}
        <div className="flex w-[400px] shrink-0 flex-col border-l border-zinc-900 bg-black">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900 bg-cover bg-center"
                style={
                  post.userImage
                    ? { backgroundImage: `url(${getAvatarUrl(post.userImage)})` }
                    : undefined
                }
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold hover:underline cursor-pointer">
                  {post.userName || "User"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {post.title || "Instagram Post"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMyPost && (
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="text-zinc-400 hover:text-red-500 transition disabled:opacity-50"
                  title="Удалить публикацию"
                >
                  {isDeleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              )}
              {/* Ellipsis parameters button */}
              <button
                className="text-zinc-300 hover:text-white transition"
                aria-label="Parameters"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Comments and Description list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Post Description (Caption) */}
            <div className="flex gap-3 items-start border-b border-zinc-900 pb-3">
              <div
                className="h-8 w-8 shrink-0 rounded-full border border-zinc-800 bg-zinc-900 bg-cover bg-center"
                style={
                  post.userImage
                    ? { backgroundImage: `url(${getAvatarUrl(post.userImage)})` }
                    : undefined
                }
              />
              <div className="flex-1 text-xs leading-relaxed">
                <div>
                  <span className="font-semibold mr-1.5 hover:underline cursor-pointer">
                    {post.userName || "User"}
                  </span>
                  <span className="text-zinc-200">
                    {post.caption || post.content || ""}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  <button className="hover:text-white transition font-medium">Ответить</button>
                  <button className="hover:text-white transition">
                    <MoreHorizontal className="h-3 w-3 inline" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {localComments && localComments.length > 0 ? (
                localComments.map((commentItem, idx) => {
                  const commentAuthorId = commentItem.userId;
                  const isMyComment = currentUserId && String(commentAuthorId) === String(currentUserId);

                  return (
                    <div key={commentItem.postCommentId ?? idx} className="flex gap-3 items-start justify-between group">
                      <div className="flex gap-3 items-start flex-1">
                        <div
                          className="h-7 w-7 shrink-0 rounded-full border border-zinc-800 bg-zinc-900 bg-cover bg-center"
                          style={
                            commentItem.userImage
                              ? { backgroundImage: `url(${getAvatarUrl(commentItem.userImage)})` }
                              : undefined
                          }
                        />
                        <div className="flex-1 text-xs leading-relaxed">
                          <div>
                            <span className="font-semibold mr-1.5 hover:underline cursor-pointer">
                              {commentItem.userName || "user"}
                            </span>
                            <span className="text-zinc-300">{commentItem.comment}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-500">
                            <span>{formatRelativeTime(commentItem.dateCommented)}</span>
                            <button className="hover:text-white transition font-medium">Ответить</button>
                            {isMyComment && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(commentItem.postCommentId)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition"
                                title="Удалить комментарий"
                              >
                                <Trash2 className="h-3 w-3 inline" />
                              </button>
                            )}
                            <button className="opacity-0 group-hover:opacity-100 hover:text-white transition">
                              <MoreHorizontal className="h-3.5 w-3.5 inline" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comment Heart Icon on right edge */}
                      <button
                        type="button"
                        onClick={() => commentItem.postCommentId && toggleLikeComment(commentItem.postCommentId)}
                        className="text-zinc-500 hover:text-zinc-300 p-1 transition shrink-0 self-start mt-0.5"
                      >
                        <Heart
                          className={`h-3 w-3 ${
                            likedComments[commentItem.postCommentId ?? 0]
                              ? "fill-red-500 text-red-500"
                              : "text-zinc-500"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
                  <span className="text-xs">Комментариев пока нет.</span>
                  <span className="text-[10px] mt-1">Будьте первым, кто оставит коммент!</span>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Statistics Insights link */}
          <div className="border-t border-zinc-900 px-4 py-2.5 bg-zinc-950/10">
            <button
              type="button"
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition"
            >
              Статистика
            </button>
          </div>

          {/* Action Panel */}
          <div className="border-t border-zinc-900 p-4 space-y-2.5 bg-zinc-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="transition hover:opacity-75"
                  aria-label={localIsLiked ? "Unlike" : "Like"}
                >
                  <Heart
                    className={`h-6 w-6 transition ${
                      localIsLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"
                    }`}
                  />
                </button>
                <button className="text-white hover:opacity-75 transition" aria-label="Comment">
                  <MessageCircle className="h-6 w-6" />
                </button>
                <button className="text-white hover:opacity-75 transition" aria-label="Share">
                  <Send className="h-6 w-6" />
                </button>
              </div>
              <button className="text-white hover:opacity-75 transition" aria-label="Save">
                <Bookmark className="h-6 w-6" />
              </button>
            </div>

            {/* Instagram Likes count */}
            <div className="text-xs font-bold text-white pt-0.5">
              {localLikesCount === 0 ? (
                <span className="text-zinc-400 font-normal">Будьте первым, кому это понравилось</span>
              ) : (
                <span>
                  {localLikesCount}{" "}
                  {localLikesCount % 10 === 1 && localLikesCount % 100 !== 11
                    ? "отметка «Нравится»"
                    : [2, 3, 4].includes(localLikesCount % 10) && ![12, 13, 14].includes(localLikesCount % 100)
                    ? "отметки «Нравится»"
                    : "отметок «Нравится»"}
                </span>
              )}
            </div>

            {/* Date */}
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 pt-0.5">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric"
              }) : ""}
            </div>
          </div>

          {/* Comment Form Input */}
          <form onSubmit={handleCommentSubmit} className="border-t border-zinc-900 px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              className="text-zinc-400 hover:text-white transition shrink-0"
              aria-label="Emoji picker"
            >
              <Smile className="h-6 w-6" />
            </button>
            <input
              type="text"
              placeholder="Добавьте комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isCommenting}
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isCommenting}
              className={`text-xs font-semibold transition disabled:opacity-40 ${
                commentText.trim() ? "text-sky-500 hover:text-sky-400" : "text-zinc-600"
              }`}
            >
              {isCommenting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
              ) : (
                "Опубликовать"
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
