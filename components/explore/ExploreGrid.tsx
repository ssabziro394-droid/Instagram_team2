"use client";

import React, { useState, useEffect } from "react";
import {
  useGetFeedQuery,
  useGetReelsQuery,
  useLikePostMutation,
  useAddPostFavoriteMutation,
  useAddCommentMutation,
  Post,
} from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";
import {
  Heart,
  MessageCircle,
  Bookmark,
  X,
  Send,
  Smile,
  Play,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ─────────────────────────────────────────────────────────────────
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
function isVideoFile(filename?: string | null): boolean {
  if (!filename) return false;
  return VIDEO_EXTS.some((ext) => filename.toLowerCase().endsWith(ext));
}

// ─── Types ────────────────────────────────────────────────────────────────────
type MediaItem = {
  kind: "post" | "reel";
  id: number;
  rawFilename: string;
  mediaUrl: string;
  isVideo: boolean;
  userName: string;
  userImage: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  caption: string | null;
  comments: Post["comments"];
  datePublished: string;
  multipleImages: boolean;
};

// ─── Post Detail Modal ────────────────────────────────────────────────────────
function PostModal({
  item,
  onClose,
  onLike,
  onSave,
}: {
  item: MediaItem;
  onClose: () => void;
  onLike: () => void;
  onSave: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [addComment] = useAddCommentMutation();
  const [localComments, setLocalComments] = useState(item.comments || []);

  // Sync comments if item changes
  useEffect(() => {
    setLocalComments(item.comments || []);
  }, [item.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    const optimistic = {
      postCommentId: Date.now(),
      userId: "me",
      userName: "You",
      userImage: null,
      dateCommented: new Date().toISOString(),
      comment: text,
    };
    setLocalComments((prev) => [...prev, optimistic]);
    try {
      await addComment({ postId: item.id, comment: text }).unwrap();
    } catch {
      setLocalComments((prev) =>
        prev.filter((c) => c.postCommentId !== optimistic.postCommentId)
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-50 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 340 }}
        className="relative flex flex-col md:flex-row w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[935px] md:rounded-sm bg-ig-bg border-0 md:border border-ig-border overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Media ── */}
        <div className="relative bg-black flex items-center justify-center shrink-0 w-full md:w-[55%] h-[45vh] md:h-auto">
          {item.isVideo ? (
            <video
              src={item.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.caption || ""}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
              }}
            />
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-ig-bg">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ig-border shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover shrink-0">
              <img
                src={getFileUrl(item.userImage, "avatar")}
                alt={item.userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFileUrl(null, "avatar");
                }}
              />
            </div>
            <span className="font-semibold text-sm text-ig-fg flex-1">
              {item.userName}
            </span>
            <button className="text-ig-fg opacity-60 hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0">
            {item.caption && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover shrink-0">
                  <img
                    src={getFileUrl(item.userImage, "avatar")}
                    alt={item.userName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFileUrl(null, "avatar");
                    }}
                  />
                </div>
                <div className="text-sm text-ig-fg leading-relaxed pt-0.5">
                  <span className="font-semibold mr-1.5">{item.userName}</span>
                  {item.caption}
                  <p className="text-[11px] text-ig-secondary mt-1">
                    {formatRelativeTime(item.datePublished)}
                  </p>
                </div>
              </div>
            )}

            {localComments.length === 0 && !item.caption && (
              <div className="flex flex-col items-center justify-center flex-1 py-10 text-ig-secondary text-sm">
                <p className="font-bold text-ig-fg text-lg mb-1">
                  No comments yet.
                </p>
                <p>Start the conversation.</p>
              </div>
            )}

            {localComments.map((c) => (
              <div key={c.postCommentId} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover shrink-0">
                  <img
                    src={getFileUrl(c.userImage, "avatar")}
                    alt={c.userName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFileUrl(null, "avatar");
                    }}
                  />
                </div>
                <div className="flex-1 text-sm text-ig-fg leading-relaxed">
                  <span className="font-semibold mr-1.5">
                    {c.userName.split("@")[0]}
                  </span>
                  {c.comment}
                  <p className="text-[11px] text-ig-secondary mt-0.5">
                    {formatRelativeTime(c.dateCommented)}
                  </p>
                </div>
                <button className="text-ig-secondary hover:text-red-400 transition-colors shrink-0 mt-1">
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-ig-border px-4 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4 items-center">
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  onClick={onLike}
                  className={cn(
                    "transition-colors",
                    item.isLiked
                      ? "text-red-500"
                      : "text-ig-fg hover:text-ig-secondary"
                  )}
                >
                  <Heart
                    className={cn("w-6 h-6", item.isLiked && "fill-red-500")}
                  />
                </motion.button>
                <button className="text-ig-fg hover:text-ig-secondary transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-ig-fg hover:text-ig-secondary transition-colors">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.75 }}
                onClick={onSave}
                className="text-ig-fg hover:text-ig-secondary transition-colors"
              >
                <Bookmark
                  className={cn("w-6 h-6", item.isSaved && "fill-ig-fg")}
                />
              </motion.button>
            </div>
            <p className="text-sm font-semibold text-ig-fg mb-1">
              {item.likeCount.toLocaleString()}{" "}
              {item.likeCount === 1 ? "like" : "likes"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-ig-secondary">
              {new Date(item.datePublished).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-3 px-4 py-3 border-t border-ig-border shrink-0"
          >
            <Smile className="w-5 h-5 text-ig-fg opacity-60 shrink-0" />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-sm text-ig-fg placeholder:text-ig-secondary outline-none"
            />
            {commentText.trim() && (
              <button
                type="submit"
                className="text-sm font-semibold text-sky-500 hover:text-sky-400 transition-colors shrink-0"
              >
                Post
              </button>
            )}
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reusable media cell content (no grid logic) ──────────────────────────────
function CellMedia({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative w-full h-full bg-zinc-900 overflow-hidden cursor-pointer group"
    >
      {item.isVideo ? (
        <video
          src={item.mediaUrl}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          muted
          playsInline
          loop
        />
      ) : (
        <img
          src={item.mediaUrl}
          alt={item.caption || ""}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.12";
          }}
        />
      )}

      {/* Badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10 pointer-events-none">
        {item.isVideo && (
          <Play className="w-4 h-4 text-white fill-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
        )}
        {item.multipleImages && !item.isVideo && (
          <Copy className="w-4 h-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5 pointer-events-none">
        <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-lg">
          <Heart className="w-5 h-5 fill-white" />
          {item.likeCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow-lg">
          <MessageCircle className="w-5 h-5 fill-white" />
          {item.commentCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Main ExploreGrid ─────────────────────────────────────────────────────────
export default function ExploreGrid() {
  const { data: postsResp, isLoading: postsLoading } = useGetFeedQuery({
    pageNumber: 1,
    pageSize: 30,
  });
  const { data: reelsResp, isLoading: reelsLoading } = useGetReelsQuery({
    pageNumber: 1,
    pageSize: 15,
  });

  const [likePost] = useLikePostMutation();
  const [savePost] = useAddPostFavoriteMutation();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    const posts: MediaItem[] = (postsResp?.data || [])
      .filter((p) => p.images && p.images.length > 0)
      .map((p) => ({
        kind: "post" as const,
        id: p.postId,
        rawFilename: p.images[0],
        mediaUrl: getFileUrl(p.images[0], "post"),
        isVideo: isVideoFile(p.images[0]),
        userName: p.userName,
        userImage: p.userImage,
        likeCount: p.postLikeCount,
        commentCount: p.commentCount,
        isLiked: p.postLike,
        isSaved: p.postFavorite,
        caption: p.content || p.title,
        comments: p.comments || [],
        datePublished: p.datePublished,
        multipleImages: p.images.length > 1,
      }));

    const reels: MediaItem[] = (reelsResp?.data || [])
      .filter((r) => r.images)
      .map((r) => ({
        kind: "reel" as const,
        id: r.postId,
        rawFilename: r.images,
        mediaUrl: getFileUrl(r.images, "reel"),
        isVideo: true,
        userName: r.userName,
        userImage: r.userImage,
        likeCount: r.postLikeCount,
        commentCount: r.commentCount,
        isLiked: r.postLike,
        isSaved: r.postFavorite,
        caption: r.content || r.title,
        comments: r.comments || [],
        datePublished: r.datePublished,
        multipleImages: false,
      }));

    // Interleave 1 reel every 6 posts (Instagram style)
    const merged: MediaItem[] = [];
    let ri = 0;
    posts.forEach((p, i) => {
      merged.push(p);
      if ((i + 1) % 6 === 0 && ri < reels.length) {
        merged.push(reels[ri++]);
      }
    });
    while (ri < reels.length) merged.push(reels[ri++]);
    setItems(merged);
  }, [postsResp, reelsResp]);

  const handleLike = async (item: MediaItem) => {
    const upd = (i: MediaItem) =>
      i.id === item.id && i.kind === item.kind
        ? { ...i, isLiked: !i.isLiked, likeCount: i.isLiked ? Math.max(0, i.likeCount - 1) : i.likeCount + 1 }
        : i;
    setItems((p) => p.map(upd));
    setSelectedItem((p) => (p ? upd(p) : null));
    try { await likePost(item.id).unwrap(); } catch { /* silent */ }
  };

  const handleSave = async (item: MediaItem) => {
    const upd = (i: MediaItem) =>
      i.id === item.id && i.kind === item.kind ? { ...i, isSaved: !i.isSaved } : i;
    setItems((p) => p.map(upd));
    setSelectedItem((p) => (p ? upd(p) : null));
    try { await savePost({ postId: item.id }).unwrap(); } catch { /* silent */ }
  };

  // ── Loading skeleton ──
  if (postsLoading || reelsLoading) {
    return (
      <div className="w-full flex flex-col gap-px">
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="grid grid-cols-3 gap-px">
            {Array.from({ length: 3 }).map((_, col) => (
              <div key={col} className="aspect-square bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-ig-secondary">
        <div className="w-14 h-14 rounded-full border-2 border-ig-border flex items-center justify-center">
          <MessageCircle className="w-6 h-6 opacity-40" />
        </div>
        <p className="font-bold text-ig-fg">No posts to explore.</p>
        <p className="text-sm">Check back later.</p>
      </div>
    );
  }

  // ── Build groups (Instagram pattern: triple → big-left → big-right → repeat) ──
  type GroupType = "triple" | "big-left" | "big-right";
  const PATTERN: GroupType[] = ["triple", "big-left", "big-right"];

  const groups: { type: GroupType; items: MediaItem[] }[] = [];
  let idx = 0;
  let pi = 0;

  while (idx < items.length) {
    const chunk = items.slice(idx, idx + 3);
    if (chunk.length === 0) break;
    groups.push({ type: PATTERN[pi % 3], items: chunk });
    idx += 3;
    pi++;
  }

  return (
    <>
      <div className="w-full flex flex-col gap-px">
        {groups.map((group, gi) => {
          const [a, b, c] = group.items;

          // ── 3 equal cells ──
          if (group.type === "triple") {
            return (
              <div key={gi} className="grid grid-cols-3 gap-px">
                {[a, b, c].map((item, ci) =>
                  item ? (
                    <div key={`${item.kind}-${item.id}`} className="aspect-square">
                      <CellMedia item={item} onClick={() => setSelectedItem(item)} />
                    </div>
                  ) : (
                    <div key={ci} className="aspect-square bg-ig-bg" />
                  )
                )}
              </div>
            );
          }

          // ── Big left (2×2) + 2 smalls stacked right ──
          if (group.type === "big-left") {
            return (
              <div
                key={gi}
                className="grid grid-cols-3 gap-px"
                style={{ gridTemplateRows: "1fr 1fr" }}
              >
                {/* Large cell: col-span-2, row-span-2 — no aspect-ratio, fills grid area */}
              <div className="col-span-2 row-span-2">
                {a && <CellMedia item={a} onClick={() => setSelectedItem(a)} />}
              </div>
                {/* Small top-right */}
                <div className="aspect-square">
                  {b && <CellMedia item={b} onClick={() => setSelectedItem(b)} />}
                </div>
                {/* Small bottom-right */}
                <div className="aspect-square">
                  {c && <CellMedia item={c} onClick={() => setSelectedItem(c)} />}
                </div>
              </div>
            );
          }

          // ── 2 smalls stacked left + big right (2×2) ──
          return (
            <div
              key={gi}
              className="grid grid-cols-3 gap-px"
              style={{ gridTemplateRows: "1fr 1fr" }}
            >
              {/* Small top-left */}
              <div className="aspect-square">
                {a && <CellMedia item={a} onClick={() => setSelectedItem(a)} />}
              </div>
              {/* Large right: col-span-2, row-span-2 — no aspect-ratio */}
              <div className="col-span-2 row-span-2">
                {b && <CellMedia item={b} onClick={() => setSelectedItem(b)} />}
              </div>
              {/* Small bottom-left */}
              <div className="col-start-1 aspect-square">
                {c && <CellMedia item={c} onClick={() => setSelectedItem(c)} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <PostModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onLike={() => handleLike(selectedItem)}
            onSave={() => handleSave(selectedItem)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
