"use client";

import React, { useRef, useState } from "react";
import { X, Search } from "lucide-react";
import {
  useCreateChatMutation,
  useGetChatsQuery,
  useGetChatUsersQuery,
} from "@/store/api/chatApi";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { decodeJWT } from "@/lib/utils";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: number) => void;
}

const DefaultAvatar = ({ className = "w-12 h-12" }: { className?: string }) => (
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

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = decodeJWT(token) as any;
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
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; username: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createChat] = useCreateChatMutation();

  const NewMesModalRef = useRef<HTMLDivElement | null>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = getUserIdFromToken(token);

  // Fetch existing chats to check if we already have a chat with the selected users
  const { data: chatsResponse } = useGetChatsQuery(undefined, {
    skip: !isOpen,
  });
  const existingChats = chatsResponse?.data || [];

  // Fetch users from /User/get-users endpoint
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetChatUsersQuery(
    {
      UserName: searchQuery || undefined,
      PageSize: 50,
    },
    { skip: !isOpen },
  );
  const apiUsers = usersResponse?.data || [];

  // Filter out the current user from the search results
  const filteredContacts = apiUsers.filter((user: any) => {
    if (!currentUserId) return true;
    return String(user.id).toLowerCase() !== String(currentUserId).toLowerCase();
  });

  const toggleSelectUser = (user: { id: string; username: string }) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleChatClick = async () => {
    if (selectedUsers.length === 0 || isCreating) return;
    setIsCreating(true);
    let finalChatId: number | null = null;
    try {
      for (const user of selectedUsers) {
        // Check if chat already exists
        const existingChat = existingChats.find((chat: any) => {
          if (!currentUserId) return false;
          const isSender =
            String(chat.sendUserId).toLowerCase() ===
            String(currentUserId).toLowerCase();
          const partnerId = isSender ? chat.receiveUserId : chat.sendUserId;
          return String(partnerId).toLowerCase() === String(user.id).toLowerCase();
        });

        if (existingChat) {
          finalChatId = existingChat.chatId;
        } else {
          const response = await createChat({ receiverUserId: user.id }).unwrap();
          if (response.data) {
            finalChatId = response.data;
          }
        }
      }
      if (finalChatId) {
        onChatCreated(finalChatId);
      }
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Failed to create chats:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={NewMesModalRef}
      onClick={(e) => {
        if (e.target === NewMesModalRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="w-full max-w-md rounded-xl bg-ig-card-bg border border-ig-border shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ig-border p-4 shrink-0">
          <div className="w-8"></div> {/* Spacer for centering */}
          <h2 className="text-ig-fg font-semibold text-lg">New message</h2>
          <button
            onClick={onClose}
            className="text-ig-fg hover:text-zinc-300 w-8 flex justify-end"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Selected Users & Search Input */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ig-border p-4 max-h-[120px] overflow-y-auto shrink-0 no-scrollbar">
          <span className="text-ig-secondary text-sm font-medium mr-1 select-none">
            To whom:
          </span>
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1.5 bg-[#3797F0]/15 hover:bg-[#3797F0]/25 text-[#3797F0] font-semibold px-2.5 py-1 rounded-full text-xs transition-colors border border-[#3797F0]/20"
            >
              <span>{user.username}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeUser(user.id);
                }}
                className="text-[#3797F0] hover:text-[#1877f2] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-ig-fg placeholder-zinc-500 flex-1 outline-none text-sm min-w-[120px] py-1"
            autoFocus
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[150px]">
          {isLoadingUsers ? (
            <div className="text-center text-ig-secondary py-8 text-sm">
              Loading users...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center text-ig-secondary py-8 text-sm">
              No account found.
            </div>
          ) : (
            filteredContacts.map((contact: any) => {
              const userId = contact.id || contact.userId;
              const username = contact.userName || contact.username;
              const fullName = contact.fullName;
              const avatarUrl = contact.avatar;
              const isSelected = selectedUsers.some((u) => u.id === userId);

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => toggleSelectUser({ id: userId, username })}
                >
                  <div className="flex items-center gap-3">
                    {renderAvatar(avatarUrl, "w-12 h-12", username)}
                    <div className="flex flex-col">
                      <span className="text-ig-fg font-medium text-sm">
                        {username}
                      </span>
                      <span className="text-ig-secondary text-sm">{fullName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-colors border shrink-0",
                      isSelected
                        ? "bg-[#3797F0] border-transparent text-white"
                        : "border-ig-border bg-transparent"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[3px]" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Chat Button */}
        <div className="p-4 border-t border-ig-border shrink-0">
          <button
            onClick={handleChatClick}
            disabled={selectedUsers.length === 0 || isCreating}
            className="w-full bg-[#3797F0] hover:bg-[#1877f2] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center"
          >
            {isCreating ? "Creating chat..." : "Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
