"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useGetUsersQuery } from "@/store/api/reelsApi";
import ShareUserGrid from "./ShareUserGrid";
import ShareActionBar from "./ShareActionBar";

interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reelId: string;
  videoUrl?: string;
}

export default function ShareSheet({
  isOpen,
  onClose,
  reelId,
  videoUrl,
}: ShareSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [messageText, setMessageText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch users from API (safe Swagger integration inside Reels module)
  const { data: apiUsers, isLoading } = useGetUsersQuery(
    { pageNumber: 1, pageSize: 30 },
    { skip: !isOpen }
  );

  // Trigger Toast Notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleUserClick = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.username === user.username);
      if (exists) {
        return prev.filter((u) => u.username !== user.username);
      } else {
        return [...prev, user];
      }
    });
  };

  // Purely local simulation flow for sending (strictly following user constraints)
  const handleSendIndividually = () => {
    showToast("Sent locally");

    // Clear selection and message input
    setSelectedUsers([]);
    setMessageText("");
  };

  const handleCreateGroup = () => {
    showToast("Создание группового чата...");
    // Clear selection and message input
    setSelectedUsers([]);
    setMessageText("");
  };

  // 1. Copy Link handler
  const handleCopyLink = () => {
    const url = `${window.location.origin}/reels?id=${reelId}`;
    navigator.clipboard.writeText(url);
    showToast("Ссылка скопирована!");
  };

  // 2. Add to story handler
  const handleAddToStory = () => {
    showToast("Добавлено в вашу историю!");
  };

  // 3. Share button handler
  const handleShare = async () => {
    const url = `${window.location.origin}/reels?id=${reelId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Instagram Reel",
          text: "Посмотрите этот ролик в Instagram!",
          url: url,
        });
        showToast("Успешно отправлено!");
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // 4. WhatsApp handler
  const handleWhatsApp = () => {
    const url = `${window.location.origin}/reels?id=${reelId}`;
    const text = encodeURIComponent(`Посмотрите этот ролик в Instagram! 🎬 ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    showToast("Ссылка отправлена в WhatsApp!");
  };

  // 5. Download handler
  const handleDownload = () => {
    if (videoUrl) {
      showToast("Загрузка видео началась...");
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `reel-${reelId}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast("Видео недоступно для скачивания.");
    }
  };

  // 6. Threads handler
  const handleThreads = () => {
    showToast("Поделились в Threads!");
  };

  // 7. SMS handler
  const handleSMS = () => {
    const url = `${window.location.origin}/reels?id=${reelId}`;
    window.open(`sms:?&body=${encodeURIComponent(`Посмотрите этот ролик! 🎬 ${url}`)}`, "_blank");
    showToast("СМС отправлено!");
  };

  const handleGroupClick = () => {
    showToast("Создание группы...");
  };

  const hasSelected = selectedUsers.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-40 cursor-pointer"
          />

          {/* Premium Bottom Sheet Drawer (Light/Dark Mode Adaptive) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 29, stiffness: 240 }}
            className="absolute bottom-0 left-0 right-0 h-[65vh] max-h-[70vh] rounded-t-[30px] bg-white dark:bg-[#1c1c1e] border-t border-zinc-200 dark:border-zinc-800/60 z-50 flex flex-col shadow-2xl overflow-hidden text-black dark:text-white transition-colors duration-150"
          >
            {/* Visual Drag Handle */}
            <div className="w-full flex justify-center py-3.5 cursor-pointer select-none" onClick={onClose}>
              <div className="w-10 h-1 bg-zinc-200 dark:bg-[#444446] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 border-b border-zinc-100 dark:border-[#2c2c2e]">
              <div className="w-6" /> {/* spacer */}
              <h3 className="font-bold text-[15px] tracking-wide select-none">Поделиться</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-[#2c2c2e] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Search & Grid section */}
            <ShareUserGrid
              users={apiUsers || []}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onUserClick={handleUserClick}
              onGroupClick={handleGroupClick}
              selectedUsernames={selectedUsers.map((u) => u.username)}
            />

            {/* Floating Premium Notification Toast */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-[180px] z-[60] bg-zinc-900/95 border border-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 select-none min-w-[160px] justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Actions or Send Flow Area (Bottom) */}
            <AnimatePresence mode="wait">
              {hasSelected ? (
                /* Selected Send Flow UI */
                <motion.div
                  key="send-flow"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.18 }}
                  className="border-t border-zinc-100 dark:border-[#2c2c2e] bg-white dark:bg-[#121212] p-4 flex flex-col gap-3.5 sticky bottom-0 z-20 shadow-[0_-12px_24px_rgba(0,0,0,0.04)] dark:shadow-none"
                >
                  {/* Write Message Input field */}
                  <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-850"
                  />

                  {/* Send Individually blue button */}
                  <button
                    onClick={handleSendIndividually}
                    className="w-full bg-[#3897f0] hover:bg-[#2083e1] text-white py-3 rounded-xl font-bold text-[13.5px] active:scale-[0.97] hover:scale-[1.01] transition-all text-center select-none cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    Отправить по отдельности
                  </button>

                  {/* Create Group Chat outline button with small overlapping avatars */}
                  <button
                    onClick={handleCreateGroup}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-zinc-200 py-3 rounded-xl font-bold text-[13.5px] active:scale-[0.97] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 select-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    {/* Small overlapping circular avatars */}
                    <div className="flex -space-x-1.5 overflow-hidden mr-1">
                      {selectedUsers.slice(0, 3).map((user) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={user.id}
                          src={user.avatarUrl}
                          alt=""
                          className="w-[18px] h-[18px] rounded-full object-cover border border-white dark:border-zinc-800"
                        />
                      ))}
                    </div>
                    <span>Создать групповой чат</span>
                  </button>
                </motion.div>
              ) : (
                /* Normal Share Actions Bar */
                <motion.div
                  key="share-actions"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.15 }}
                >
                  <ShareActionBar
                    onCopyLink={handleCopyLink}
                    onAddToStory={handleAddToStory}
                    onShare={handleShare}
                    onWhatsApp={handleWhatsApp}
                    onDownload={handleDownload}
                    onThreads={handleThreads}
                    onSMS={handleSMS}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
