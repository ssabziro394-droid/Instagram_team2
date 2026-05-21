"use client";

import React, { useState } from "react";
import { SquarePen, ChevronDown } from "lucide-react";
import {
  useGetChatsQuery,
  useGetMyProfileQuery,
  useGetChatByIdQuery,
} from "@/store/api/chatApi";
import { NewMessageModal } from "./NewMessageModal";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { jwtDecode } from "jwt-decode";

interface ChatSidebarProps {
  activeChatId: number | null;
  onSelectChat: (chatId: number) => void;
}

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<any>(token);
    return decoded.sid;
  } catch (e) {
    return null;
  }
};

const DefaultAvatar = ({ className = "w-14 h-14" }: { className?: string }) => (
  <div
    className={clsx(
      className,
      "rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden shrink-0 border border-zinc-700/50",
    )}
  >
    <svg
      className="w-2/3 h-2/3 text-zinc-500"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  </div>
);

const resolveFileUrl = (url: string | null | undefined) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
  return `https://instagram-api.softclub.tj/images/${cleanUrl}`;
};

const renderAvatar = (
  src: string | null | undefined,
  className = "w-14 h-14",
  alt = "User",
) => {
  if (!src || src.trim() === "") {
    return <DefaultAvatar className={className} />;
  }
  const resolved = resolveFileUrl(src);
  return (
    <img
      src={resolved}
      alt={alt}
      className={clsx(className, "rounded-full object-cover shrink-0")}
    />
  );
};

interface SidebarChatItemProps {
  chat: any;
  currentUserId: string | null;
  activeChatId: number | null;
  onSelectChat: (chatId: number) => void;
  activeTab: "Messages" | "Requests";
}

function SidebarChatItem({
  chat,
  currentUserId,
  activeChatId,
  onSelectChat,
  activeTab,
}: SidebarChatItemProps) {
  const chatId = chat.chatId;

  // Query each chat's messages to determine if the user has talked yet
  const { data: chatDetails } = useGetChatByIdQuery({ chatId });
  const messages = chatDetails?.data || [];

  // Determine if the chat has no messages yet (initial-chat where they haven't written to each other)
  const isInitial = messages.length === 0;

  // Filter based on active tab
  if (activeTab === "Requests" && !isInitial) return null;
  if (activeTab === "Messages" && isInitial) return null;

  // Determine partner details

  // here current user id
  const isCurrentUserSender = currentUserId
    ? String(chat.sendUserId).toLowerCase() ===
      String(currentUserId).toLowerCase()
    : false;
  const partnerName = isCurrentUserSender
    ? chat.receiveUserName
    : chat.sendUserName;

  const partnerImage = isCurrentUserSender
    ? chat.receiveUserImage
    : chat.sendUserImage;

  // Determine the last message content (newest message is at index 0 from API)
  const lastMsg = messages[0];
  let lastMsgText = "No messages yet";
  if (lastMsg) {
    if (lastMsg.messageText) {
      lastMsgText = lastMsg.messageText;
    } else if (lastMsg.file) {
      const cleanUrl = lastMsg.file.toLowerCase();
      if (
        cleanUrl.endsWith(".mp3") ||
        cleanUrl.endsWith(".wav") ||
        cleanUrl.endsWith(".ogg") ||
        cleanUrl.endsWith(".m4a") ||
        cleanUrl.endsWith(".webm")
      ) {
        lastMsgText = "🎵 Voice message";
      } else {
        lastMsgText = "📷 Photo";
      }
    }
  }

  return (
    <div
      onClick={() => onSelectChat(chatId)}
      className={clsx(
        "flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors",
        activeChatId === chatId ? "bg-zinc-800/50" : "hover:bg-zinc-800/30",
      )}
    >
      <div className="relative">
        {renderAvatar(partnerImage, "w-14 h-14")}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-950 rounded-full" />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-zinc-50 text-sm font-medium">
          {partnerName || "Unknown User"}
        </span>
        <span className="text-zinc-500 text-xs truncate mt-0.5">
          {lastMsgText}
        </span>
      </div>
    </div>
  );
}

export function ChatSidebar({ activeChatId, onSelectChat }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"Messages" | "Requests">(
    "Messages",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = getUserIdFromToken(token);

  const { data: response, isLoading } = useGetChatsQuery();
  const { data: profileResponse } = useGetMyProfileQuery();

  const chats = response?.data || [];
  const currentUsername = profileResponse?.data?.userName || "Loading...";

  return (
    <div className="w-[350px] flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <button className="flex items-center gap-2 text-zinc-50 font-bold text-xl hover:text-zinc-300 transition-colors">
          {currentUsername}
          <ChevronDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-zinc-50 hover:text-zinc-300 transition-colors"
        >
          <SquarePen className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pb-2 border-b border-zinc-800">
        <button
          className={clsx(
            "flex-1 pb-3 text-sm font-semibold transition-colors relative",
            activeTab === "Messages"
              ? "text-zinc-50"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          onClick={() => setActiveTab("Messages")}
        >
          Messages
          {activeTab === "Messages" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-50" />
          )}
        </button>
        <button
          className={clsx(
            "flex-1 pb-3 text-sm font-semibold transition-colors relative",
            activeTab === "Requests"
              ? "text-zinc-50"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          onClick={() => setActiveTab("Requests")}
        >
          Requests
          {activeTab === "Requests" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-50" />
          )}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto pt-2">
        {isLoading ? (
          <div className="p-4 text-zinc-500 text-sm text-center">
            Loading messages...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-zinc-500 text-sm text-center">
            No messages yet.
          </div>
        ) : (
          chats.map((chat: any) => (
            <SidebarChatItem
              key={chat.chatId}
              chat={chat}
              currentUserId={currentUserId}
              activeChatId={activeChatId}
              onSelectChat={onSelectChat}
              activeTab={activeTab}
            />
          ))
        )}
      </div>

      <NewMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChatCreated={(chatId) => {
          onSelectChat(chatId);
        }}
      />
    </div>
  );
}
