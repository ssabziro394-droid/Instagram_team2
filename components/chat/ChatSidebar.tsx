"use client";

import React, { useState } from "react";
import { SquarePen, ChevronDown, Trash2, Search } from "lucide-react";
import Link from "next/link";
import {
  useGetChatsQuery,
  useGetChatMyProfileQuery,
  useGetChatByIdQuery,
  useDeleteChatMutation,
} from "@/store/api/chatApi";
import { NewMessageModal } from "./NewMessageModal";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { decodeJWT } from "@/lib/utils";

interface ChatSidebarProps {
  activeChatId: number | null;
  onSelectChat: (chatId: number | null) => void;
}

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = decodeJWT(token) as any;
    return decoded?.sid;
  } catch (e) {
    return null;
  }
};

const DefaultAvatar = ({ className = "w-14 h-14" }: { className?: string }) => (
  <div
    className={clsx(
      className,
      "rounded-full bg-ig-sidebar-hover flex items-center justify-center text-ig-secondary overflow-hidden shrink-0 border border-zinc-700/50",
    )}
  >
    <svg
      className="w-2/3 h-2/3 text-ig-secondary"
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
  onSelectChat: (chatId: number | null) => void;
  activeTab: "Messages" | "Requests";
}
const SidebarSkeleton = () => (
  <div className="space-y-4 px-6 pt-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
        <div className="w-14 h-14 bg-zinc-800/80 rounded-full shrink-0" />
        <div className="flex-1 space-y-2.5 overflow-hidden">
          <div className="h-3 bg-ig-sidebar-hover rounded-full w-2/5" />
          <div className="h-2.5 bg-zinc-800/60 rounded-full w-3/5" />
        </div>
      </div>
    ))}
  </div>
);

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
  const [deleteChat, { isLoading: isDeleting }] = useDeleteChatMutation();
  const messages = chatDetails?.data || [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Determine if the chat has no messages yet (initial-chat where they haven't written to each other)
  const isInitial = messages.length === 0;

  // Filter based on active tab
  if (activeTab === "Requests" && !isInitial) return null;
  if (activeTab === "Messages" && isInitial) return null;

  // Determine partner details
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteChat({ chatId }).unwrap();
      if (activeChatId === chatId) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      onClick={() => onSelectChat(chatId)}
      className={clsx(
        "flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors group relative",
        activeChatId === chatId ? "bg-zinc-800/50" : "hover:bg-zinc-800/30",
      )}
    >
      <Link
        href={`/${partnerName}`}
        onClick={(e) => e.stopPropagation()}
        className="relative block hover:opacity-90 transition-opacity"
      >
        {renderAvatar(partnerImage, "w-14 h-14")}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-950 rounded-full" />
      </Link>
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-ig-fg text-sm font-medium">
          {partnerName || "Unknown User"}
        </span>
        <span className="text-ig-secondary text-xs truncate mt-0.5">
          {lastMsgText}
        </span>
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded-lg text-ig-secondary hover:text-red-500 transition-all shrink-0 disabled:opacity-50"
        title="Delete Chat"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div
            className="bg-ig-card-bg w-[260px] md:w-[400px] rounded-xl overflow-hidden flex flex-col text-center shadow-2xl border border-ig-border animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex flex-col gap-2">
              <h3 className="text-ig-fg text-lg font-semibold leading-snug">
                Delete chat?
              </h3>
              <p className="text-ig-secondary text-xs leading-relaxed px-2">
                Once you delete your copy of this conversation, it cannot be
                undone.
              </p>
            </div>

            <div className="flex flex-col border-t border-ig-border">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
                disabled={isDeleting}
                className="py-3 text-red-500 font-bold text-sm hover:bg-white/5 active:bg-white/10 transition-colors border-b border-ig-border disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="py-3 text-ig-fg font-normal text-sm hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatSidebar({ activeChatId, onSelectChat }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"Messages" | "Requests">(
    "Messages",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = getUserIdFromToken(token);

  const { data: response, isLoading } = useGetChatsQuery();
  const { data: profileResponse } = useGetChatMyProfileQuery();

  const chats = response?.data || [];
  const currentUsername = profileResponse?.data?.userName || "Loading...";

  // Client-side synchronous search filtering
  const filteredChats = chats.filter((chat: any) => {
    const isCurrentUserSender = currentUserId
      ? String(chat.sendUserId).toLowerCase() ===
        String(currentUserId).toLowerCase()
      : false;
    const partnerName = isCurrentUserSender
      ? chat.receiveUserName
      : chat.sendUserName;
    return (partnerName || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
  });

  // Mock notes data matching the Instagram aesthetic
  const mockNotes = [
    {
      id: "current-user",
      userName: "Your note",
      avatar: profileResponse?.data?.avatar || null,
      noteText: "Первая заметка...",
    },
    {
      id: "note-2",
      userName: "parvizak",
      avatar:
        chats.find((c: any) => {
          const isSender = currentUserId
            ? String(c.sendUserId).toLowerCase() ===
              String(currentUserId).toLowerCase()
            : false;
          const pName = isSender ? c.receiveUserName : c.sendUserName;
          return pName === "parvizak";
        })?.receiveUserImage ||
        chats[0]?.receiveUserImage ||
        chats[0]?.sendUserImage ||
        null,
      noteText: "🎵 Breath of L...\nSina Bathaie...\n🌹",
    },
    {
      id: "note-3",
      userName: "narueq",
      avatar:
        chats.find((c: any) => {
          const isSender = currentUserId
            ? String(c.sendUserId).toLowerCase() ===
              String(currentUserId).toLowerCase()
            : false;
          const pName = isSender ? c.receiveUserName : c.sendUserName;
          return pName === "narueq";
        })?.receiveUserImage ||
        chats[1]?.receiveUserImage ||
        chats[1]?.sendUserImage ||
        null,
      noteText: "Working on it 💻",
    },
    {
      id: "note-4",
      userName: "Umed_Fozil",
      avatar: null,
      noteText: "Active now! 🔥",
    },
  ];

  return (
    <div
      className={clsx(
        "w-full md:w-[350px] flex-shrink-0 border-r border-ig-border bg-ig-bg flex flex-col h-full",
        activeChatId !== null && "hidden md:flex",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <button className="flex items-center gap-2 text-ig-fg font-bold text-xl hover:text-zinc-300 transition-colors">
          {currentUsername}
          <ChevronDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-ig-fg hover:text-zinc-300 transition-colors"
        >
          <SquarePen className="w-6 h-6" />
        </button>
      </div>

      {/* Synchronous Search Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 bg-ig-card-bg border border-ig-border rounded-xl px-3 py-2 text-ig-secondary focus-within:border-zinc-700 transition-colors">
          <Search className="w-4 h-4 text-ig-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-ig-fg placeholder-zinc-500 flex-1 outline-none text-sm"
          />
        </div>
      </div>

      {/* Notes Section */}
      <div
        className="px-6 py-2 overflow-x-auto flex gap-4 border-b border-zinc-900/60 select-none pb-4 mb-2"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {mockNotes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col items-center shrink-0 w-20 relative pt-1 pb-2"
          >
            {/* Note bubble */}
            <div className="relative bg-ig-sidebar-hover text-ig-fg text-[10px] px-2 py-1.5 rounded-2xl mb-2 text-center w-[78px] min-h-[42px] flex items-center justify-center shadow-lg border border-zinc-700/30">
              <span className="line-clamp-2 leading-tight font-medium whitespace-pre-line">
                {note.noteText}
              </span>
              {/* Triangle Tail */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ig-sidebar-hover rotate-45 border-r border-b border-zinc-700/30"></div>
            </div>

            {/* User Avatar */}
            <div className="relative">
              {renderAvatar(note.avatar, "w-14 h-14", note.userName)}
              {note.id !== "current-user" && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-950 rounded-full" />
              )}
            </div>

            {/* Label */}
            <span className="text-[11px] text-ig-secondary truncate w-full text-center mt-1 font-normal">
              {note.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pb-2 border-b border-ig-border">
        <button
          className={clsx(
            "flex-1 pb-3 text-sm font-semibold transition-colors relative",
            activeTab === "Messages"
              ? "text-ig-fg"
              : "text-ig-secondary hover:text-zinc-300",
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
              ? "text-ig-fg"
              : "text-ig-secondary hover:text-zinc-300",
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
          <SidebarSkeleton />
        ) : chats.length === 0 ? (
          <div className="p-4 text-ig-secondary text-sm text-center">
            No messages yet.
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-ig-secondary text-sm text-center">
            No chats match search query.
          </div>
        ) : (
          filteredChats.map((chat: any) => (
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
