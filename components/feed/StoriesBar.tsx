"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Heart, X, ChevronLeft, ChevronRight, Loader2, Trash2, Eye } from "lucide-react";
import { 
  useGetStoriesQuery, 
  useGetMyStoriesQuery,
  useLazyGetUserStoriesQuery,
  useAddStoryMutation, 
  useDeleteStoryMutation, 
  useLikeStoryMutation, 
  useAddStoryViewMutation,
  UserStories,
  StoryItem
} from "@/store/api/feedApi";
import { useGetUsersQuery } from "@/store/api/searchApi";
import { getFileUrl } from "@/lib/file";
import { decodeJWT } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

// No mock stories used anymore

export default function StoriesBar() {
  const token = useSelector((state: RootState) => state.auth.token);
  const { data: apiStories = [], isLoading, refetch: refetchStories } = useGetStoriesQuery(undefined, {
    pollingInterval: 30000, // Refresh stories every 30 seconds
    skip: !token, // Prevent 401 errors when not logged in
  });

  const { data: myStoriesResponse, refetch: refetchMyStories } = useGetMyStoriesQuery(undefined, {
    pollingInterval: 30000,
    skip: !token,
  });

  const { data: usersResponse } = useGetUsersQuery(undefined, { skip: !token });
  const allUsers = usersResponse || [];

  const refetch = useCallback(() => {
    refetchStories();
    refetchMyStories();
  }, [refetchStories, refetchMyStories]);
  
  const [addStory, { isLoading: isUploading }] = useAddStoryMutation();
  const [deleteStory] = useDeleteStoryMutation();
  const [likeStory] = useLikeStoryMutation();
  const [addStoryView] = useAddStoryViewMutation();
  const [getUserStories] = useLazyGetUserStoriesQuery();

  const [currentUser, setCurrentUser] = useState<{ sid: string; name: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(-1);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localLikes, setLocalLikes] = useState<Record<number, boolean>>({});
  const [viewedStoryIds, setViewedStoryIds] = useState<number[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize viewed stories from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("viewed_stories");
        if (stored) setViewedStoryIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse viewed stories", e);
      }
    }
  }, []);

  // Decode user JWT token on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded && decoded.sid && decoded.name) {
          setCurrentUser({ sid: decoded.sid, name: decoded.name });
        }
      }
    }
  }, []);

  // Filter own stories and other users stories
  const ownUserStories = myStoriesResponse?.data || apiStories.find(u => u.userId === currentUser?.sid);
  const otherUsersStories = apiStories.filter(u => u.userId !== currentUser?.sid);
  
  const currentUserData = allUsers.find((u: any) => u.userId === currentUser?.sid || u.id === currentUser?.sid);
  const currentUserAvatar = currentUserData?.userImage || currentUserData?.avatar || null;
  
  // Use API stories only
  const displayStoriesList = otherUsersStories;

  // Create combined list of active stories for the fullscreen viewer modal
  const activeViewerList: UserStories[] = [];
  if (ownUserStories && ownUserStories.stories.length > 0) {
    activeViewerList.push(ownUserStories);
  }
  activeViewerList.push(...displayStoriesList);

  // Story viewer navigation callbacks
  const handleNextStory = useCallback(() => {
    if (activeUserIndex === -1) return;
    const currentUserStories = activeViewerList[activeUserIndex];
    if (activeStoryIndex < currentUserStories.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next user
      if (activeUserIndex < activeViewerList.length - 1) {
        setActiveUserIndex(prev => prev + 1);
        setActiveStoryIndex(0);
        setProgress(0);
      } else {
        // End of list, close modal
        setIsViewerOpen(false);
      }
    }
  }, [activeUserIndex, activeStoryIndex, activeViewerList]);

  const handlePrevStory = useCallback(() => {
    if (activeUserIndex === -1) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous user
      if (activeUserIndex > 0) {
        const prevUserIndex = activeUserIndex - 1;
        setActiveUserIndex(prevUserIndex);
        setActiveStoryIndex(activeViewerList[prevUserIndex].stories.length - 1);
        setProgress(0);
      } else {
        // First slide of first user, just restart
        setProgress(0);
      }
    }
  }, [activeUserIndex, activeStoryIndex, activeViewerList]);

  // Automatic progression logic (5 seconds per story slide)
  useEffect(() => {
    if (!isViewerOpen || activeUserIndex === -1) return;

    setProgress(0);
    const intervalTime = 50; // Update progress every 50ms
    const duration = 5000;   // 5 seconds slide time
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextStory();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStoryIndex, activeUserIndex, isViewerOpen, handleNextStory]);

  // Call the view endpoint whenever the active story changes
  useEffect(() => {
    if (isViewerOpen && activeUserIndex !== -1) {
      const currentStory = activeViewerList[activeUserIndex]?.stories[activeStoryIndex];
      if (currentStory) {
        // Add to local viewed state
        if (!viewedStoryIds.includes(currentStory.id)) {
          const newViewed = [...viewedStoryIds, currentStory.id];
          setViewedStoryIds(newViewed);
          if (typeof window !== "undefined") {
            localStorage.setItem("viewed_stories", JSON.stringify(newViewed));
          }
        }
        
        // Call API if not mock
        if (!currentStory.id.toString().startsWith("mock")) {
          addStoryView(currentStory.id);
        }
      }
    }
  }, [activeUserIndex, activeStoryIndex, isViewerOpen]);

  // Handle uploading new story
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

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening viewer
    fileInputRef.current?.click();
  };

  const handleOpenViewer = async (userId: string) => {
    // Try hitting the single user story endpoint just like real Instagram
    if (!userId.startsWith("mock")) {
      try {
        await getUserStories(userId).unwrap();
      } catch (err) {
        console.error("Failed to fetch specific user stories:", err);
      }
    }

    const index = activeViewerList.findIndex(u => u.userId === userId);
    if (index !== -1) {
      setActiveUserIndex(index);
      setActiveStoryIndex(0);
      setProgress(0);
      setIsViewerOpen(true);
    }
  };

  // Delete current story
  const handleDeleteStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentViewerUser = activeViewerList[activeUserIndex];
    const currentStory = currentViewerUser?.stories[activeStoryIndex];
    if (!currentStory) return;

    try {
      await deleteStory(currentStory.id).unwrap();
      refetch();
      
      // If user had only 1 story, closing or next story is handled
      if (currentViewerUser.stories.length <= 1) {
        setIsViewerOpen(false);
      } else {
        handleNextStory();
      }
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isViewerOpen) return;
      if (e.key === "Escape") setIsViewerOpen(false);
      if (e.key === "ArrowRight") handleNextStory();
      if (e.key === "ArrowLeft") handlePrevStory();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewerOpen, handleNextStory, handlePrevStory]);

  const currentViewerUser = activeUserIndex !== -1 ? activeViewerList[activeUserIndex] : null;
  const currentStory = currentViewerUser ? currentViewerUser.stories[activeStoryIndex] : null;

  const isLiked = currentStory 
    ? (localLikes[currentStory.id] !== undefined 
        ? localLikes[currentStory.id] 
        : (currentStory.viewerDto?.viewLike === 1))
    : false;

  const handleLikeStory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    const isMock = currentStory.id.toString().startsWith("mock");
    
    // Toggle locally for instant UI response
    setLocalLikes(prev => ({ ...prev, [currentStory.id]: !isLiked }));

    if (!isMock) {
      try {
        await likeStory(currentStory.id).unwrap();
        refetch();
      } catch (err) {
        // Revert local state on error
        setLocalLikes(prev => ({ ...prev, [currentStory.id]: isLiked }));
        console.error("Failed to like story:", err);
      }
    }
  };

  const storyMediaUrl = currentStory ? getFileUrl(currentStory.fileName, "post") : "";
  const isVideoStory = storyMediaUrl.includes("/videos/") || [".mp4", ".webm", ".mov", ".avi", ".mkv"].some(ext => storyMediaUrl.toLowerCase().includes(ext));

  return (
    <div className="w-full border-b border-ig-border mb-2 py-4 px-1">
      {/* Hidden file input for uploading stories */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />

      <div className="flex gap-4 overflow-x-auto scrollbar-none w-full">
        {/* 1. Own User story item */}
        {currentUser && (
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none">
            <div className="relative">
              {ownUserStories && ownUserStories.stories.length > 0 ? (() => {
                const isAllViewed = ownUserStories.stories.every(s => viewedStoryIds.includes(s.id));
                return (
                  // Own story exists: show gradient ring or gray ring if viewed
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
                        onError={(e) => {
                          e.currentTarget.src = getFileUrl(null, "avatar");
                        }}
                      />
                    </div>
                  </div>
                );
              })() : (
                // No own story: show empty circle with Plus trigger
                <div 
                  onClick={triggerUpload}
                  className="w-[66px] h-[66px] rounded-full p-[2px] bg-ig-sidebar-hover border border-ig-border flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : (
                    <img
                      src={getFileUrl(currentUserAvatar, "avatar")}
                      alt="Add Story"
                      className="w-full h-full rounded-full object-cover opacity-80"
                      onError={(e) => {
                        e.currentTarget.src = getFileUrl(null, "avatar");
                      }}
                    />
                  )}
                </div>
              )}

              {/* Upload trigger button (small blue plus icon overlay) */}
              <div 
                onClick={triggerUpload}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-1 border-2 border-black flex items-center justify-center transition-colors active:scale-95"
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 text-white animate-spin" />
                ) : (
                  <Plus className="h-3 w-3 text-white fill-white" />
                )}
              </div>
            </div>
            
            <span className="text-[10px] text-zinc-400 mt-1.5 max-w-[66px] truncate text-center group-hover:text-zinc-200 transition-colors">
              Your Story
            </span>
          </div>
        )}

        {/* 2. Other users' stories list */}
        {displayStoriesList.map((user) => {
          const isAllViewed = user.stories.length > 0 && user.stories.every(s => viewedStoryIds.includes(s.id));
          
          return (
            <div 
              key={user.userId} 
              onClick={() => handleOpenViewer(user.userId)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group select-none"
            >
              {/* Avatar Ring */}
              <div className="relative">
                <div className={cn(
                  "w-[66px] h-[66px] rounded-full p-[2px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                  isAllViewed ? "bg-zinc-800" : "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
                )}>
                  <div className="w-full h-full rounded-full p-[2px] bg-ig-bg">
                    <img
                      src={getFileUrl(user.userImage, "avatar")}
                      alt={user.userName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getFileUrl(null, "avatar");
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Story Username */}
              <span className={cn(
                "text-[10px] mt-1.5 max-w-[66px] truncate text-center transition-colors",
                isAllViewed ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-300 group-hover:text-white"
              )}>
                {user.userName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Fullscreen Story Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && currentViewerUser && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
          >
            {/* Desktop Left navigation arrow */}
            <button 
              onClick={handlePrevStory}
              className="hidden md:flex absolute left-8 w-11 h-11 rounded-full bg-zinc-900/60 border border-zinc-800 items-center justify-center text-white hover:bg-zinc-800 transition-colors z-40"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Main story card */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[420px] h-full md:h-[85vh] md:max-h-[800px] aspect-[9/16] md:rounded-xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl"
            >
              {/* Media Image or Video */}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                {isVideoStory ? (
                  <video
                    src={storyMediaUrl}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={storyMediaUrl}
                    alt="Story Content"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                )}
              </div>

              {/* Left/Right click targets for easy clicking */}
              <div 
                onClick={handlePrevStory}
                className="absolute top-0 left-0 w-[30%] h-full z-20 cursor-pointer"
              />
              <div 
                onClick={handleNextStory}
                className="absolute top-0 right-0 w-[70%] h-full z-20 cursor-pointer"
              />

              {/* Top Controls Area */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-30 pointer-events-none">
                {/* Progress Indicators */}
                <div className="flex gap-1.5 mb-4">
                  {currentViewerUser.stories.map((story, idx) => (
                    <div 
                      key={story.id} 
                      className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full bg-white transition-all duration-50ms ease-linear"
                        style={{
                          width: 
                            idx < activeStoryIndex 
                              ? "100%" 
                              : idx === activeStoryIndex 
                                ? `${progress}%` 
                                : "0%"
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header User Info */}
                <div className="flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900">
                      <img
                        src={getFileUrl(currentViewerUser.userImage || currentStory.userAvatar, "avatar")}
                        alt={currentViewerUser.userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFileUrl(null, "avatar");
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-white drop-shadow">
                        {currentViewerUser.userName}
                      </span>
                      <span className="text-[10px] text-zinc-300 ml-2 drop-shadow">
                        {new Date(currentStory.createAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    {/* Delete button (only show for own user stories) */}
                    {currentUser && currentViewerUser.userId === currentUser.sid && (
                      <button
                        onClick={handleDeleteStory}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-red-400 hover:text-red-350 transition-colors"
                        title="Delete Story"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsViewerOpen(false)}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom interaction bar */}
              <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-30 flex items-center justify-between gap-4 pointer-events-auto">
                {/* Views indicator (only visible on own stories) */}
                {currentUser && currentViewerUser.userId === currentUser.sid ? (
                  <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/40 px-3 py-2 rounded-full border border-white/10 select-none">
                    <Eye className="h-4 w-4" />
                    <span>{currentStory.viewerDto?.viewCount || 0} views</span>
                  </div>
                ) : (
                  <div className="flex-1 bg-transparent px-4 py-2 border border-white/30 rounded-full text-zinc-300 text-xs select-none">
                    Replying is currently disabled
                  </div>
                )}

                {/* Like Button */}
                <button
                  onClick={handleLikeStory}
                  className="p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-all active:scale-90"
                >
                  <Heart 
                    className={cn(
                      "h-5 w-5 transition-colors", 
                      isLiked ? "fill-red-500 text-red-500" : "text-white"
                    )} 
                  />
                </button>
              </div>
            </motion.div>

            {/* Desktop Right navigation arrow */}
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
