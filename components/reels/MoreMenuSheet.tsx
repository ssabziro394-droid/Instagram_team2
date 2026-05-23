"use client";

import React from "react";
import { 
  X, 
  Bookmark, 
  RefreshCcw, 
  Play, 
  Sliders, 
  EyeOff, 
  AlertTriangle, 
  Maximize2, 
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reelId: string;
  isSaved: boolean;
  onSave: () => void;
  onToggleFullscreen: () => void;
  onToggleAutoScroll: () => void;
  isAutoScrollActive: boolean;
  isFullscreenActive: boolean;
}

export default function MoreMenuSheet({
  isOpen,
  onClose,
  reelId,
  isSaved,
  onSave,
  onToggleFullscreen,
  onToggleAutoScroll,
  isAutoScrollActive,
  isFullscreenActive
}: MoreMenuSheetProps) {
  const menuItems = [
    {
      label: isSaved ? "Unsave" : "Save",
      icon: <Bookmark className={`w-5 h-5 ${isSaved ? "text-yellow-500 fill-yellow-500" : "text-white"}`} />,
      action: () => {
        onSave();
        onClose();
      },
    },
    {
      label: "Remix Reel",
      icon: <RefreshCcw className="w-5 h-5 text-white" />,
      action: () => {
        alert("Remix features initiated!");
        onClose();
      },
    },
    {
      label: isFullscreenActive ? "Exit Fullscreen" : "Fullscreen Player",
      icon: <Maximize2 className="w-5 h-5 text-white" />,
      action: () => {
        onToggleFullscreen();
        onClose();
      },
    },
    {
      label: isAutoScrollActive ? "Disable Auto-scroll" : "Enable Auto-scroll",
      icon: <Play className={`w-5 h-5 ${isAutoScrollActive ? "text-sky-400" : "text-white"}`} />,
      action: () => {
        onToggleAutoScroll();
        onClose();
      },
    },
    {
      label: "Why you're seeing this post",
      icon: <HelpCircle className="w-5 h-5 text-zinc-400" />,
      action: () => {
        alert("This post matches your active interests in street styling and design.");
        onClose();
      },
    },
    {
      label: "Not Interested",
      icon: <EyeOff className="w-5 h-5 text-zinc-400" />,
      action: () => {
        alert("We will tune your algorithm to show fewer posts like this.");
        onClose();
      },
    },
    {
      label: "Content Preferences",
      icon: <Sliders className="w-5 h-5 text-zinc-400" />,
      action: () => {
        alert("Redirecting to content preferences settings.");
        onClose();
      },
    },
    {
      label: "Report Post",
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      action: () => {
        alert("Post reported successfully. Thank you for making our platform safer.");
        onClose();
      },
      danger: true,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 z-40 cursor-pointer"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 max-h-[85%] rounded-t-2xl bg-zinc-950 border-t border-zinc-900 z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Grab indicator */}
            <div className="w-full flex justify-center py-3.5 cursor-grab active:cursor-grabbing" onClick={onClose}>
              <div className="w-10 h-1 bg-zinc-800 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-zinc-900">
              <span className="font-bold text-base text-zinc-100">Options</span>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 divide-y divide-zinc-900/40 space-y-0.5 scrollbar-none pb-8">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-zinc-900/60 transition-all text-left group active:scale-[0.99]"
                >
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-zinc-850 transition-colors">
                    {item.icon}
                  </div>
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      item.danger
                        ? "text-red-500 hover:text-red-400"
                        : "text-zinc-200 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
