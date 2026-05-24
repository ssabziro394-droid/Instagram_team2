"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Volume2,
  VolumeX,
  UserPlus,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ShareSheet from "@/components/reels/ShareSheet";
import Link from "next/link";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
function isVideoFile(filename?: string | null): boolean {
  if (!filename) return false;
  return VIDEO_EXTS.some((ext) => filename.toLowerCase().endsWith(ext));
}

// ─── Types ─────────────────────────────────────────────────────────────────────
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
  const [muted, setMuted] = useState(true);
  const [addComment] = useAddCommentMutation();
  const [localComments, setLocalComments] = useState(item.comments || []);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // ESC key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    setLocalComments(item.comments || []);
  }, [item.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    const optimistic = {
      postCommentId: Date.now(),
      userId: "me",
      userName: "Вы",
      userImage: null,
      dateCommented: new Date().toISOString(),
      comment: text,
    };
    setLocalComments((prev) => [...prev, optimistic]);
    try {
      await addComment({ postId: Number(item.id), comment: text }).unwrap();
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-[110] w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative flex flex-col md:flex-row w-[90vw] max-w-[960px] h-[90vh] max-h-[600px] rounded-none md:rounded-sm bg-ig-bg border border-ig-border overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black flex items-center justify-center shrink-0 w-full md:w-[60%] h-[50%] md:h-full">
          {item.isVideo ? (
            <>
              <video
                src={item.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                playsInline
                muted={muted}
              />
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-colors z-10"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.caption || "Post image"}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
              }}
            />
          )}
        </div>

        
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-ig-border">

          <div className="flex items-center gap-3 px-4 py-3 border-b border-ig-border shrink-0">
            <Link href={`/${item.userName}`} className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover border border-ig-border shrink-0 ring-2 ring-ig-border block hover:opacity-80 transition-opacity">
              <img
                src={getFileUrl(item.userImage, "avatar")}
                alt={item.userName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
              />
            </Link>
            <Link href={`/${item.userName}`} className="font-semibold text-sm text-ig-fg flex-1 truncate hover:text-ig-secondary transition-colors block">
              {item.userName}
            </Link>
            <button className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors shrink-0">
              <UserPlus className="w-3.5 h-3.5" />
              Follow
            </button>
            <button className="text-ig-fg/40 hover:text-ig-fg transition-colors ml-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comments scroll area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ig-border">

            {/* Caption as first "comment" */}
            {item.caption && (
              <div className="flex gap-3 items-start">
                <Link href={`/${item.userName}`} className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover shrink-0 block hover:opacity-80 transition-opacity">
                  <img
                    src={getFileUrl(item.userImage, "avatar")}
                    alt={item.userName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                  />
                </Link>
                <div className="text-sm text-ig-fg leading-relaxed pt-0.5 flex-1">
                  <Link href={`/${item.userName}`} className="font-semibold mr-1.5 hover:text-ig-secondary transition-colors inline-block">{item.userName}</Link>
                  {item.caption}
                  <p className="text-[11px] text-ig-secondary mt-1.5">
                    {formatRelativeTime(item.datePublished)}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {localComments.length === 0 && !item.caption && (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-ig-secondary text-sm gap-2">
                <MessageCircle className="w-11 h-11 opacity-20" />
                <p className="font-bold text-ig-fg text-sm">No comments yet.</p>
                <p className="text-xs">Start the conversation.</p>
              </div>
            )}

            {/* Comments list */}
            {localComments.map((c) => (
              <div key={c.postCommentId} className="flex gap-3 items-start group/comment">
                <Link href={`/${c.userName}`} className="w-8 h-8 rounded-full overflow-hidden bg-ig-sidebar-hover shrink-0 block hover:opacity-80 transition-opacity">
                  <img
                    src={getFileUrl(c.userImage, "avatar")}
                    alt={c.userName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                  />
                </Link>
                <div className="flex-1 text-sm text-ig-fg leading-relaxed">
                  <Link href={`/${c.userName}`} className="font-semibold mr-1.5 hover:text-ig-secondary transition-colors inline-block">
                    {c.userName?.split("@")[0] || c.userName}
                  </Link>
                  {c.comment}
                  <p className="text-[11px] text-ig-secondary mt-0.5">
                    {formatRelativeTime(c.dateCommented)}
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-ig-secondary hover:text-red-400 shrink-0 mt-0.5"
                  aria-label="Like comment"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="border-t border-ig-border px-4 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-4 items-center">
                <motion.button
                  whileTap={{ scale: 0.78 }}
                  onClick={onLike}
                  aria-label={item.isLiked ? "Unlike" : "Like"}
                  className={cn(
                    "transition-colors",
                    item.isLiked ? "text-red-500" : "text-ig-fg hover:text-ig-secondary"
                  )}
                >
                  <Heart className={cn("w-6 h-6", item.isLiked && "fill-red-500")} />
                </motion.button>
                <button
                  aria-label="Comment"
                  className="text-ig-fg hover:text-ig-secondary transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsShareOpen(true)}
                  aria-label="Share"
                  className="text-ig-fg hover:text-ig-secondary transition-colors"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.78 }}
                onClick={onSave}
                aria-label={item.isSaved ? "Unsave" : "Save"}
                className="text-ig-fg hover:text-ig-secondary transition-colors"
              >
                <Bookmark className={cn("w-6 h-6", item.isSaved && "fill-ig-fg")} />
              </motion.button>
            </div>
            <p className="text-sm font-semibold text-ig-fg">
              {item.likeCount.toLocaleString()}{" "}
              {item.likeCount === 1 ? "like" : "likes"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-ig-secondary mt-0.5">
              {new Date(item.datePublished).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Comment input */}
          <form
            onSubmit={handleSubmitComment}
            className="flex items-center gap-2 px-4 py-3 border-t border-ig-border shrink-0"
          >
            <Smile className="w-5 h-5 text-ig-fg/40 shrink-0" />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-sm text-ig-fg placeholder:text-ig-secondary outline-none"
            />
            {commentText.trim() && (
              <motion.button
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                type="submit"
                className="text-sm font-semibold text-sky-500 hover:text-white transition-colors shrink-0"
              >
                Post
              </motion.button>
            )}
          </form>
        </div>
      </motion.div>

      {/* Share Sheet */}
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reelId={String(item.id)}
        videoUrl={item.isVideo ? item.mediaUrl : undefined}
      />
    </motion.div>
  );
}

function GridCell({
  item,
  onClick,
  className,
}: {
  item: MediaItem;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full h-full bg-zinc-900 overflow-hidden cursor-pointer group",
        className
      )}
    >
      {item.isVideo ? (
        <video
          src={item.mediaUrl}
          className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
          muted
          playsInline
          loop
          preload="metadata"
        />
      ) : (
        <img
          src={item.mediaUrl}
          alt={item.caption || ""}
          className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.04]"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.08";
          }}
        />
      )}

      {/* Corner badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 pointer-events-none">
        {item.isVideo && (
          <Play className="w-4 h-4 text-white fill-white drop-shadow-[0_1px_6px_rgba(0,0,0,1)]" />
        )}
        {item.multipleImages && !item.isVideo && (
          <Copy className="w-4 h-4 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,1)]" />
        )}
      </div>

      {/* Hover overlay - simplified to only show icons without dark background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-5 pointer-events-none">
        <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow">
          <Heart className="w-5 h-5 fill-white" />
          {item.likeCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5 text-white font-bold text-sm drop-shadow">
          <MessageCircle className="w-5 h-5 fill-white" />
          {item.commentCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── GridSkeleton ──────────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="w-full flex flex-col gap-px animate-pulse">
      {/* Row 1: 3 equal squares */}
      <div className="grid grid-cols-3 gap-px">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square bg-zinc-800/70" />
        ))}
      </div>
      {/* Row 2: big-left feature block */}
      <div className="grid grid-cols-3 gap-px" style={{ aspectRatio: "3/2" }}>
        <div className="col-span-2 row-span-2 bg-zinc-800/70" />
        <div className="bg-zinc-800/50" />
        <div className="bg-zinc-800/50" />
      </div>
      {/* Row 3: 3 equal squares */}
      <div className="grid grid-cols-3 gap-px">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square bg-zinc-800/70" />
        ))}
      </div>
      {/* Row 4: big-right feature block */}
      <div className="grid grid-cols-3 gap-px" style={{ aspectRatio: "3/2" }}>
        <div className="bg-zinc-800/50" />
        <div className="col-span-2 row-span-2 bg-zinc-800/70" />
        <div className="col-start-1 bg-zinc-800/50" />
      </div>
    </div>
  );
}

// ─── ExploreGrid (Main) ────────────────────────────────────────────────────────
//
// Layout pattern (repeating every 3 groups of 3 items = 9 items):
//
//   GROUP 0 — "triple":   [A] [B] [C]  → 3 equal 1×1 squares
//
//   GROUP 1 — "big-left": [  A  ][B]   → A spans 2 cols × 2 rows
//                         [     ][C]
//
//   GROUP 2 — "big-right":[A][  B  ]   → B spans 2 cols × 2 rows
//                         [C][     ]
//
// The key insight for making row-span work reliably in CSS Grid:
//   • gridTemplateRows must be set to explicit equal heights, NOT "1fr 1fr"
//     (because "1fr" in a grid with both span-1 and span-2 items produces
//     inconsistent sizing when the container has no intrinsic height).
//   • We derive the row height from the container width using a ResizeObserver,
//     so each small cell is perfectly square (width/3) and the large cell is
//     exactly 2× that plus the 1px gap.
//
export default function ExploreGrid() {
  // ── API hooks (untouched) ──
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

  // ── UI state ──
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // ResizeObserver logic removed per requirements
  // We now rely purely on CSS gridAutoRows

  // ── Data merging (untouched logic) ──
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

    const merged: MediaItem[] = [];
    let ri = 0;
    posts.forEach((p, i) => {
      merged.push(p);
      if ((i + 1) % 6 === 0 && ri < reels.length) merged.push(reels[ri++]);
    });
    while (ri < reels.length) merged.push(reels[ri++]);
    setItems(merged);
  }, [postsResp, reelsResp]);

  // ── Interaction handlers (untouched logic) ──
  const handleLike = useCallback(
    async (item: MediaItem) => {
      const upd = (i: MediaItem) =>
        i.id === item.id && i.kind === item.kind
          ? {
              ...i,
              isLiked: !i.isLiked,
              likeCount: i.isLiked
                ? Math.max(0, i.likeCount - 1)
                : i.likeCount + 1,
            }
          : i;
      setItems((p) => p.map(upd));
      setSelectedItem((p) => (p ? upd(p) : null));
      try {
        await likePost(item.id).unwrap();
      } catch { /* silent optimistic */ }
    },
    [likePost]
  );

  const handleSave = useCallback(
    async (item: MediaItem) => {
      const upd = (i: MediaItem) =>
        i.id === item.id && i.kind === item.kind
          ? { ...i, isSaved: !i.isSaved }
          : i;
      setItems((p) => p.map(upd));
      setSelectedItem((p) => (p ? upd(p) : null));
      try {
        await savePost({ postId: item.id }).unwrap();
      } catch { /* silent optimistic */ }
    },
    [savePost]
  );

  // ── Render guards ──
  if (postsLoading || reelsLoading) return <GridSkeleton />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-ig-secondary">
        <div className="w-16 h-16 rounded-full border-2 border-ig-border flex items-center justify-center opacity-40">
          <MessageCircle className="w-7 h-7" />
        </div>
        <p className="font-bold text-ig-fg text-base">No posts yet</p>
        <p className="text-sm">Follow users to see their posts here</p>
      </div>
    );
  }

  // ── Build groups ──
  type GroupType = "triple" | "big-left" | "big-right";
  const PATTERN: GroupType[] = ["triple", "big-left", "big-right"];
  const groups: { type: GroupType; items: MediaItem[] }[] = [];
  let cursor = 0;
  let patternIdx = 0;

  while (cursor < items.length) {
    const chunk = items.slice(cursor, cursor + 3);
    if (chunk.length === 0) break;
    groups.push({ type: PATTERN[patternIdx % 3], items: chunk });
    cursor += 3;
    patternIdx++;
  }

  return (
    <>
      <div className="w-full max-w-[560px] mx-auto flex flex-col gap-px">
        {groups.map((group, gi) => {
          const [a, b, c] = group.items;
          

          if (group.type === "triple") {
            return (
              <div key={gi} className="grid grid-cols-3 gap-px">
                {([a, b, c] as (MediaItem | undefined)[]).map((item, ci) =>
                  item ? (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className="aspect-square overflow-hidden"
                    >
                      <GridCell item={item} onClick={() => setSelectedItem(item)} />
                    </div>
                  ) : (
                    <div key={ci} className="aspect-square bg-ig-bg" />
                  )
                )}
              </div>
            );
          }

          // ── Pattern B: big cell on LEFT, 2 small on right ────────────────
          //
          //  CSS Grid layout (3 cols, 2 rows):
          //  ┌─────────────┬──────┐
          //  │             │  b   │  row 1
          //  │      a      ├──────┤
          //  │  col 1-2    │  c   │  row 2
          //  └─────────────┴──────┘
          //
          if (group.type === "big-left") {
            return (
              <div key={gi} className="grid grid-cols-3 gap-px">
                {/* Large cell */}
                <div className="col-span-2 row-span-2 aspect-square overflow-hidden">
                  {a && (
                    <GridCell item={a} onClick={() => setSelectedItem(a)} />
                  )}
                </div>

                {/* Small top-right */}
                <div className="aspect-square overflow-hidden">
                  {b && (
                    <GridCell item={b} onClick={() => setSelectedItem(b)} />
                  )}
                </div>

                {/* Small bottom-right */}
                <div className="aspect-square overflow-hidden">
                  {c && (
                    <GridCell item={c} onClick={() => setSelectedItem(c)} />
                  )}
                </div>
              </div>
            );
          }

          // ── Pattern C: 2 small on left, big cell on RIGHT ────────────────
          //
          //  CSS Grid layout (3 cols, 2 rows):
          //  ┌──────┬─────────────┐
          //  │  a   │             │  row 1
          //  ├──────┤      b      │
          //  │  c   │  col 2-3    │  row 2
          //  └──────┴─────────────┘
          //
          return (
            <div key={gi} className="grid grid-cols-3 gap-px">
              {/* Small top-left */}
              <div className="aspect-square overflow-hidden">
                {a && (
                  <GridCell item={a} onClick={() => setSelectedItem(a)} />
                )}
              </div>

              {/* Large cell — explicitly placed at col 2, row 1, spans 2 cols, 2 rows */}
              <div className="col-span-2 row-span-2 aspect-square overflow-hidden">
                {b && (
                  <GridCell item={b} onClick={() => setSelectedItem(b)} />
                )}
              </div>

              {/* Small bottom-left — must be explicitly placed at col 1 row 2 */}
              <div className="col-start-1 row-start-2 aspect-square overflow-hidden">
                {c && (
                  <GridCell item={c} onClick={() => setSelectedItem(c)} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
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
