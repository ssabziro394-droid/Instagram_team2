"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import {
  useCreateChatMutation,
  useGetChatsQuery,
  useGetUsersQuery,
} from "@/store/api/chatApi";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { jwtDecode } from "jwt-decode";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: number) => void;
}

const DefaultAvatar = ({ className = "w-12 h-12" }: { className?: string }) => (
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

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<any>(token);
    return (
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      decoded.nameid ||
      decoded.sub ||
      decoded.id ||
      decoded.userId
    );
  } catch (e) {
    return null;
  }
};

const renderAvatar = (
  src: string | null | undefined,
  className = "w-12 h-12",
  alt = "User",
) => {
  if (
    !src ||
    src.trim() === "" ||
    src.includes("placeholder") ||
    src.includes("pravatar.cc")
  ) {
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

export function NewMessageModal({
  isOpen,
  onClose,
  onChatCreated,
}: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createChat, { isLoading }] = useCreateChatMutation();

  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = getUserIdFromToken(token);

  // Fetch existing chats to filter out users we already have a chat with
  const { data: chatsResponse } = useGetChatsQuery(undefined, {
    skip: !isOpen,
  });
  const existingChats = chatsResponse?.data || [];

  // Fetch users from /User/get-users endpoint
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersQuery(
    {
      UserName: searchQuery || undefined,
      PageSize: 50,
    },
    { skip: !isOpen },
  );
  const apiUsers = usersResponse?.data || [];

  // Collect existing chatted user IDs & usernames
  const chattedUserIds = new Set<string>();
  const chattedUsernames = new Set<string>();

  existingChats.forEach((chat: any) => {
    if (currentUserId) {
      const isSender =
        String(chat.sendUserId).toLowerCase() ===
        String(currentUserId).toLowerCase();
      const partnerId = isSender ? chat.receiveUserId : chat.sendUserId;
      const partnerName = isSender ? chat.receiveUserName : chat.sendUserName;
      if (partnerId) chattedUserIds.add(partnerId);
      if (partnerName) chattedUsernames.add(partnerName);
    } else {
      if (chat.sendUserId) chattedUserIds.add(chat.sendUserId);
      if (chat.receiveUserId) chattedUserIds.add(chat.receiveUserId);
      if (chat.sendUserName) chattedUsernames.add(chat.sendUserName);
      if (chat.receiveUserName) chattedUsernames.add(chat.receiveUserName);
    }
  });

  // Filter users to show only those we don't have a chat-box with yet
  const filteredContacts = apiUsers.filter((user: any) => {
    const userId = user.id || user.userId;
    const userName = user.userName || user.username;
    return !chattedUserIds.has(userId) && !chattedUsernames.has(userName);
  });

  const handleCreateChat = async (userId: string) => {
    try {
      const response = await createChat({ receiverUserId: userId }).unwrap();
      const newChatId = response.data;
      if (newChatId) {
        onChatCreated(newChatId);
        onClose();
      }
    } catch (error) {
      console.error("Failed to create chat", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div className="w-8"></div> {/* Spacer for centering */}
          <h2 className="text-zinc-50 font-semibold text-lg">New message</h2>
          <button
            onClick={onClose}
            className="text-zinc-50 hover:text-zinc-300 w-8 flex justify-end"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-zinc-800 p-4">
          <span className="text-zinc-50 font-medium whitespace-nowrap">
            To:
          </span>
          <div className="flex items-center flex-1 bg-zinc-950 rounded-lg px-3 py-1.5 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
            <Search className="w-4 h-4 text-zinc-400 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-zinc-50 placeholder-zinc-500 flex-1 outline-none text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {isLoadingUsers ? (
            <div className="text-center text-zinc-500 py-8 text-sm">
              Loading users...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-sm">
              No account found.
            </div>
          ) : (
            filteredContacts.map((contact: any) => {
              const userId = contact.id || contact.userId;
              const username = contact.userName || contact.username;
              const fullName = contact.fullName;
              const avatarUrl = contact.avatar;

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => handleCreateChat(userId)}
                >
                  <div className="flex items-center gap-3">
                    {renderAvatar(avatarUrl, "w-12 h-12", username)}
                    <div className="flex flex-col">
                      <span className="text-zinc-50 font-medium text-sm">
                        {username}
                      </span>
                      <span className="text-zinc-500 text-sm">{fullName}</span>
                    </div>
                  </div>
                  <button
                    disabled={isLoading}
                    className="w-6 h-6 rounded-full border-2 border-zinc-700 flex items-center justify-center pointer-events-none"
                  >
                    {/* Empty circle for checklist style */}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
