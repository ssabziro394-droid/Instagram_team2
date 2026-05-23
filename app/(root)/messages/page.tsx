"use client";

import React, { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { NewMessageModal } from "@/components/chat/NewMessageModal";

export default function MessagesPage() {
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  console.log(isNewMessageModalOpen);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Sidebar - Left Column */}
      <ChatSidebar
        activeChatId={activeChatId}
        onSelectChat={(chatId) => setActiveChatId(chatId)}
      />

      {/* Chat Area - Right Column */}
      <ChatArea
        chatId={activeChatId}
        onNewMessageTrigger={() => setIsNewMessageModalOpen(true)}
        onBack={() => setActiveChatId(null)}
      />

      {/* New Message Modal - Triggered from Empty State */}
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onChatCreated={(chatId) => {
          setActiveChatId(chatId);
          setIsNewMessageModalOpen(false);
        }}
      />
    </div>
  );
}
