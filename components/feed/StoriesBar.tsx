"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Heart, X, ChevronLeft, ChevronRight, Loader2, Trash2, Eye } from "lucide-react";
import {
  useGetMyStoriesQuery,
  useGetStoriesQuery,
  useAddStoryMutation,
  useDeleteStoryMutation,
  useLikeStoryMutation,
  useAddStoryViewMutation,
  UserStories,
  StoryItem,
} from "@/store/api/feedApi";
import { getFileUrl } from "@/lib/file";
import { decodeJWT } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetMyProfileQuery } from "@/store/api/profileApi";

export default function StoriesBar() {
  const token = useSelector((state: RootState) => state.auth.token);

  // Current user from JWT
  const [currentUser, setCurrentUser] = useState<{ sid: string; name: string } | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      if (t) {
        const decoded = decodeJWT(t);
        if (decoded?.sid && decoded?.name) {
          setCurrentUser({ sid: decoded.sid, name: decoded.name });
        }
      }
    }
  }, []);

  // Fetch my own stories
  const { data: myStoriesResponse, refetch: refetchMyStories } = useGetMyStoriesQuery(undefined, {
    pollingInterval: 30000,
    skip: !token,
  });

  // Fetch my profile for up-to-date avatar
  const { data: myProfile } = useGetMyProfileQuery();
  const myAvatarUrl = myProfile?.image ?? myProfile?.avatar ?? myProfile?.avatarUrl ?? myProfile?.imageUrl ?? null;


  // Fetch all other users' stories
  const { data: allStoriesResponse = [], refetch: refetchAllStories } = useGetStoriesQuery(undefined, {
    pollingInterval: 30000,
    skip: !token,
  });

  const refetch = useCallback(() => {
    refetchMyStories();
    refetchAllStories();
  }, [refetchMyStories, refetchAllStories]);

  const [addStory, { isLoading: isUploading }] = useAddStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();
  const [likeStory] = useLikeStoryMutation();
  const [addStoryView] = useAddStoryViewMutation();

  // Viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(-1);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localLikes, setLocalLikes] = useState<Record<number, boolean>>({});
  const [viewedStoryIds, setViewedStoryIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("viewed_stories");
        if (stored) setViewedStoryIds(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const ownUserStories = myStoriesResponse?.data ?? null;
  // Filter out current user's entry from get-stories (shown separately in own-story bubble)
  const displayStoriesList: UserStories[] = allStoriesResponse.filter(
    (s) => s.stories && s.stories.length > 0 && s.userId !== currentUser?.sid
  );

  // Combined list for viewer
  const activeViewerList: UserStories[] = [];
  if (ownUserStories && ownUserStories.stories.length > 0) {
    activeViewerList.push(ownUserStories);
  }
  activeViewerList.push(...displayStoriesList);

  // Navigation
  const handleNextStory = useCallback(() => {
    if (activeUserIndex === -1) return;
    const cur = activeViewerList[activeUserIndex];
    if (activeStoryIndex < cur.stories.length - 1) {
      setActiveStoryIndex((p) => p + 1);
      setProgress(0);
    } else if (activeUserIndex < activeViewerList.length - 1) {
      setActiveUserIndex((p) => p + 1);
      setActiveStoryIndex(0);
      setProgress(0);
    } else {
      setIsViewerOpen(false);
    }
  }, [activeUserIndex, activeStoryIndex, activeViewerList]);

  const handlePrevStory = useCallback(() => {
    if (activeUserIndex === -1) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((p) => p - 1);
      setProgress(0);
    } else if (activeUserIndex > 0) {
      const prev = activeUserIndex - 1;
      setActiveUserIndex(prev);
      setActiveStoryIndex(activeViewerList[prev].stories.length - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  }, [activeUserIndex, activeStoryIndex, activeViewerList]);

  // Auto-progress
  useEffect(() => {
    if (!isViewerOpen || activeUserIndex === -1) return;
    setProgress(0);
    const step = (50 / 5000) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(timer); handleNextStory(); return 100; }
        return p + step;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [activeStoryIndex, activeUserIndex, isViewerOpen, handleNextStory]);

  // Mark viewed
  useEffect(() => {
    if (!isViewerOpen || activeUserIndex === -1) return;
    const story = activeViewerList[activeUserIndex]?.stories[activeStoryIndex];
    if (!story) return;
    if (!viewedStoryIds.includes(story.id)) {
      const next = [...viewedStoryIds, story.id];
      setViewedStoryIds(next);
      if (typeof window !== "undefined") localStorage.setItem("viewed_stories", JSON.stringify(next));
    }
    addStoryView(story.id);
  }, [activeUserIndex, activeStoryIndex, isViewerOpen]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isViewerOpen) return;
      if (e.key === "Escape") setIsViewerOpen(false);
      if (e.key === "ArrowRight") handleNextStory();
      if (e.key === "ArrowLeft") handlePrevStory();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isViewerOpen, handleNextStory, handlePrevStory]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await addStory({ image: file }).unwrap();
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetch();
    } catch (err) {
      console.error("Failed to upload story:", err);
    }
  };

  const handleOpenViewer = async (userId: string) => {
    const index = activeViewerList.findIndex((u) => u.userId === userId);
    if (index !== -1) {
      setActiveUserIndex(index);
      setActiveStoryIndex(0);
      setProgress(0);
      setIsViewerOpen(true);
    }
  };

  const handleDeleteStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const viewerUser = activeViewerList[activeUserIndex];
    const story = viewerUser?.stories[activeStoryIndex];
    if (!story) return;
    try {
      await deleteStory(story.id).unwrap();
      refetch();
      if (viewerUser.stories.length <= 1) setIsViewerOpen(false);
      else handleNextStory();
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  const currentViewerUser = activeUserIndex !== -1 ? activeViewerList[activeUserIndex] : null;
  const currentStory: StoryItem | null = currentViewerUser ? currentViewerUser.stories[activeStoryIndex] : null;

  const isLiked = currentStory
    ? (localLikes[currentStory.id] !== undefined ? localLikes[currentStory.id] : currentStory.liked ?? false)
    : false;

  const handleLikeStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    setLocalLikes((p) => ({ ...p, [currentStory.id]: !isLiked }));
    try {
      await likeStory(currentStory.id).unwrap();
    } catch {
      setLocalLikes((p) => ({ ...p, [currentStory.id]: isLiked }));
    }
  };

  const storyMediaUrl = currentStory ? getFileUrl(currentStory.fileName, "post") : "";
  const isVideoStory = [".mp4", ".webm", ".mov", ".avi", ".mkv"].some((ext) =>
    storyMediaUrl.toLowerCase().includes(ext)
  );

  const hasAnyStories = activeViewerList.length > 0;

  return (
    <div className="w-full border-b border-ig-border mb-2 py-4 px-1">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

      <div className="flex gap-4 overflow-x-auto scrollbar-none w-full">
        {/* Own story bubble */}
        {currentUser && (
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none">
            <div className="relative">
              {ownUserStories && ownUserStories.stories.length > 0 ? (() => {
                const isAllViewed = ownUserStories.stories.every((s) => viewedStoryIds.includes(s.id));
                return (
                  <div
                    onClick={() => handleOpenViewer(currentUser.sid)}
                    className={cn(
                      "w-[66px] h-[66px] rounded-full p-[2px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                      isAllViewed ? "bg-zinc-800" : "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
                    )}
                  >
                    <div className="w-full h-full rounded-full p-[2px] bg-ig-bg">
                      <img
                        src={getFileUrl(ownUserStories.userImage, "avatar")}
                        alt="Your Story"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                      />
                    </div>
                  </div>
                );
              })() : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[66px] h-[66px] rounded-full p-[2px] bg-ig-sidebar-hover border border-ig-border flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {isUploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={getFileUrl(myAvatarUrl, "avatar")}
                        alt="Add Story"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-1 border-2 border-ig-bg flex items-center justify-center transition-colors active:scale-95"
              >
                {isUploading ? <Loader2 className="h-3 w-3 text-white animate-spin" /> : <Plus className="h-3 w-3 text-white fill-white" />}
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1.5 max-w-[66px] truncate text-center group-hover:text-zinc-200 transition-colors">
              Ваша история
            </span>
          </div>
        )}

        {/* Following users stories */}
        {displayStoriesList.map((user) => {
          const isAllViewed = user.stories.length > 0 && user.stories.every((s) => viewedStoryIds.includes(s.id));
          return (
            <div
              key={user.userId}
              onClick={() => handleOpenViewer(user.userId)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
            >
              <div
                className={cn(
                  "w-[66px] h-[66px] rounded-full p-[2px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                  isAllViewed ? "bg-zinc-800" : "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
                )}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-ig-bg">
                  <img
                    src={getFileUrl(user.userImage, "avatar")}
                    alt={user.userName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                  />
                </div>
              </div>
              <span className={cn(
                "text-[10px] mt-1.5 max-w-[66px] truncate text-center transition-colors",
                isAllViewed ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-300 group-hover:text-white"
              )}>
                {user.userName}
              </span>
            </div>
          );
        })}

        {/* Empty state if no following stories and own is empty */}
        {!currentUser && !hasAnyStories && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-2 px-1">
            <span>Войдите, чтобы видеть истории</span>
          </div>
        )}
      </div>

      {/* Fullscreen viewer */}
      <AnimatePresence>
        {isViewerOpen && currentViewerUser && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <button
              onClick={handlePrevStory}
              className="hidden md:flex absolute left-8 w-11 h-11 rounded-full bg-zinc-900/60 border border-zinc-800 items-center justify-center text-white hover:bg-zinc-800 transition-colors z-40"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] h-full md:h-[85vh] md:max-h-[800px] aspect-[9/16] md:rounded-xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl"
            >
              {/* Media */}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                {isVideoStory ? (
                  <video src={storyMediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={storyMediaUrl} alt="Story" className="w-full h-full object-cover select-none" />
                )}
              </div>

              {/* Click zones */}
              <div onClick={handlePrevStory} className="absolute top-0 left-0 w-[30%] h-full z-20 cursor-pointer" />
              <div onClick={handleNextStory} className="absolute top-0 right-0 w-[70%] h-full z-20 cursor-pointer" />

              {/* Top overlay */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-30 pointer-events-none">
                {/* Progress bars */}
                <div className="flex gap-1.5 mb-4">
                  {currentViewerUser.stories.map((story, idx) => (
                    <div key={story.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-50ms ease-linear"
                        style={{ width: idx < activeStoryIndex ? "100%" : idx === activeStoryIndex ? `${progress}%` : "0%" }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header */}
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900">
                      <img
                        src={getFileUrl(currentViewerUser.userImage, "avatar")}
                        alt={currentViewerUser.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = getFileUrl(null, "avatar"); }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-white drop-shadow">{currentViewerUser.userName}</span>
                      <span className="text-[10px] text-zinc-300 ml-2 drop-shadow">
                        {new Date(currentStory.createAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && currentViewerUser.userId === currentUser.sid && (
                      <button onClick={handleDeleteStory} className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setIsViewerOpen(false)} className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-30 flex items-center justify-between gap-4 pointer-events-auto">
                {currentUser && currentViewerUser.userId === currentUser.sid ? (
                  <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/40 px-3 py-2 rounded-full border border-white/10 select-none">
                    <Eye className="h-4 w-4" />
                    <span>{(currentStory as any).viewerDto?.viewCount ?? (currentStory as any).likedCount ?? 0} просмотров</span>
                  </div>
                ) : (
                  <div className="flex-1 bg-transparent px-4 py-2 border border-white/30 rounded-full text-zinc-300 text-xs select-none">
                    Ответить недоступно
                  </div>
                )}
                <button onClick={handleLikeStory} className="p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-all active:scale-90">
                  <Heart className={cn("h-5 w-5 transition-colors", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
                </button>
              </div>
            </motion.div>

            <button
              onClick={handleNextStory}
              className="hidden md:flex absolute right-8 w-11 h-11 rounded-full bg-zinc-900/60 border border-zinc-800 items-center justify-center text-white hover:bg-zinc-800 transition-colors z-40"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
