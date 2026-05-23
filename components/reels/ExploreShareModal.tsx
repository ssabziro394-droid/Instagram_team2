"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Check, Send } from "lucide-react";
import { useGetUsersQuery } from "@/store/api/reelsApi";
import { useCreateChatMutation, useSendMessageMutation } from "@/store/api/chatApi";
import { Reel } from "./types";

interface ExploreShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel;
}

export default function ExploreShareModal({
  isOpen,
  onClose,
  reel,
}: ExploreShareModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");

  // Fetch users list
  const { data: users, isLoading } = useGetUsersQuery({
    pageNumber: 1,
    pageSize: 30,
  });

  const [createChat] = useCreateChatMutation();
  const [sendMessage] = useSendMessageMutation();

  // Filter users based on query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    return users.filter((u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (!isOpen) return null;

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId === selectedUserId ? null : userId);
  };

  const handleSend = async () => {
    if (!selectedUserId || isSending) return;

    setIsSending(true);
    setSendStatus("idle");

    try {
      // 1. Create or get a chat with the selected user
      const chatRes = await createChat({ receiverUserId: selectedUserId }).unwrap();
      const chatId = chatRes.data || chatRes;

      if (!chatId) {
        throw new Error("Could not create/retrieve chat ID");
      }

      // 2. Prepare sharing text (Link to this Reel on the website)
      const reelLink = `${window.location.origin}/reels?id=${reel.id}`;
      const finalMessage = messageText.trim()
        ? `${messageText.trim()}\n\n🎬 Watch Reel: ${reelLink}`
        : `🎬 Shared a reel: ${reelLink}`;

      // 3. Send message
      await sendMessage({
        chatId: Number(chatId),
        messageText: finalMessage,
      }).unwrap();

      setSendStatus("success");
      setMessageText("");
      setSelectedUserId(null);

      // Close modal after success toast
      setTimeout(() => {
        setSendStatus("idle");
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error sharing reel:", error);
      setSendStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
          <div className="w-6" /> {/* spacer */}
          <h3 className="font-bold text-base tracking-wide">Share Reel</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-zinc-800">
          <div className="relative flex items-center bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-700/30 focus-within:border-pink-500/50 transition-colors">
            <Search className="w-4 h-4 text-zinc-400 mr-2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[200px]">
          {isLoading ? (
            <div className="w-full h-32 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-zinc-800 border-t-pink-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="w-full h-32 flex items-center justify-center text-zinc-500 text-sm">
              No users found.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUserId === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-pink-500/10 border border-pink-500/30"
                      : "hover:bg-zinc-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                      alt={user.username}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                    />
                    <span className="font-semibold text-sm">@{user.username}</span>
                  </div>
                  {/* Select Checkbox/Dot */}
                  <div
                    className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-pink-500 border-pink-500"
                        : "border-zinc-600 group-hover:border-zinc-400"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer message and send button */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Write a message (optional)..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!selectedUserId || isSending}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-700 text-white disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!selectedUserId || isSending}
            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              selectedUserId
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/10 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            } ${isSending ? "opacity-75" : ""}`}
          >
            {isSending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : sendStatus === "success" ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Sent successfully!</span>
              </>
            ) : sendStatus === "error" ? (
              <span>Error sharing, try again</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send to Chat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
