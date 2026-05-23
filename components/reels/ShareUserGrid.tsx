"use client";

import React from "react";
import { Search, UserPlus, Check } from "lucide-react";

interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

interface ShareUserGridProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onUserClick: (user: User) => void;
  onGroupClick: () => void;
  selectedUsernames: string[];
}

export const FALLBACK_USERS: User[] = [
  {
    id: "fb-1",
    username: "Бародарон🫂❤️",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-2",
    username: "zoirzoda01🩺",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-3",
    username: "abdullowoh77",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-4",
    username: "Ahmadshoh Hayotov",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-5",
    username: "mahmadiev_01.01",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-6",
    username: "_Azim_l6l",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-7",
    username: "daler_2oo9",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-8",
    username: "yasin_sharipov",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "fb-9",
    username: "kosimzoda_0007",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
  }
];

export default function ShareUserGrid({
  users,
  isLoading,
  searchQuery,
  setSearchQuery,
  onUserClick,
  onGroupClick,
  selectedUsernames,
}: ShareUserGridProps) {
  const displayUsers = users && users.length > 0 ? users : FALLBACK_USERS;
  
  const filteredUsers = displayUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1e] text-black dark:text-white transition-colors duration-150">
      {/* Search and Group bar */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 select-none">
        {/* Search input wrapper */}
        <div className="flex-1 flex items-center bg-[#f2f2f2] dark:bg-[#262626] rounded-xl px-3 py-2 border border-zinc-200/40 dark:border-zinc-800/10 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors">
          <Search className="w-[17px] h-[17px] text-zinc-400 dark:text-zinc-500 mr-2" />
          <input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none pr-2 font-normal"
          />
        </div>

        {/* Group Add button (right) */}
        <button
          onClick={onGroupClick}
          className="w-[38px] h-[38px] flex items-center justify-center rounded-full bg-[#f2f2f2] dark:bg-[#262626] text-zinc-700 dark:text-zinc-100 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#323232] transition-all active:scale-90 cursor-pointer shadow-sm"
        >
          <UserPlus className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Suggested Users Grid (3 columns scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-none pb-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-y-6 gap-x-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-[72px] h-[72px] rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-12 h-3 bg-zinc-200 dark:bg-zinc-800 rounded mt-2.5" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex justify-center items-center py-12 text-sm text-zinc-400 dark:text-zinc-500">
            Ничего не найдено
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-6 gap-x-4">
            {filteredUsers.map((user) => {
              const isSelected = selectedUsernames.includes(user.username);
              
              return (
                <div
                  key={user.id}
                  onClick={() => onUserClick(user)}
                  className="flex flex-col items-center group cursor-pointer select-none"
                >
                  {/* Avatar container */}
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className={`w-[72px] h-[72px] rounded-full object-cover border transition-all duration-150 group-hover:scale-[1.03] group-active:scale-[0.96] ${
                        isSelected 
                          ? "border-blue-500 p-[1.5px] scale-[1.02]" 
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    />
                    
                    {/* Blue check badge overlay bottom-right */}
                    {isSelected && (
                      <div className="absolute bottom-0 right-0 w-5.5 h-5.5 bg-[#007aff] rounded-full border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center shadow-md animate-scaleIn select-none">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                      </div>
                    )}
                  </div>
                  
                  {/* Username */}
                  <span className="text-[11.5px] font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white text-center mt-2.5 truncate max-w-[85px] leading-tight select-none">
                    {user.username}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
