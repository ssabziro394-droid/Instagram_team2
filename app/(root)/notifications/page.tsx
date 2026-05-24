"use client";

import React, { useState } from "react";
import SearchBar from "@/components/search/SearchBar";

// ─── Interfaces ─────────────────────────────────────────────────────────────

type NotificationFilter = "All" | "People you follow" | "Comments" | "Follows";

interface User {
  id: string;
  username: string;
  avatarUrl: string;
  hasActiveStory?: boolean;
}

export type NotificationType = "like_multi" | "follow_back" | "following";

export interface BaseNotification {
  id: string;
  type: NotificationType;
  timestamp: string; // e.g. "6h", "15h"
  isNew: boolean;
}

export interface LikeMultiNotification extends BaseNotification {
  type: "like_multi";
  users: User[];
  targetMediaUrl: string;
  totalLikesCount: number;
}

export interface FollowNotification extends BaseNotification {
  type: "follow_back" | "following";
  user: User;
}

export type AppNotification = LikeMultiNotification | FollowNotification;

export interface NotificationGroup {
  label: string;
  items: AppNotification[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_DATA: NotificationGroup[] = [
  {
    label: "Today",
    items: [
      {
        id: "notif-1",
        type: "like_multi",
        isNew: true,
        timestamp: "6h",
        users: [
          { id: "u1", username: "alex_designs", avatarUrl: "https://i.pravatar.cc/150?u=12", hasActiveStory: false },
          { id: "u2", username: "maria_ui", avatarUrl: "https://i.pravatar.cc/150?u=24", hasActiveStory: false },
        ],
        targetMediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        totalLikesCount: 14,
      },
      {
        id: "notif-2",
        type: "follow_back",
        isNew: true,
        timestamp: "15h",
        user: { id: "u3", username: "design_system_pro", avatarUrl: "https://i.pravatar.cc/150?u=35", hasActiveStory: true },
      },
    ],
  },
  {
    label: "This week",
    items: [
      {
        id: "notif-3",
        type: "following",
        isNew: false,
        timestamp: "2d",
        user: { id: "u4", username: "creative_mike", avatarUrl: "https://i.pravatar.cc/150?u=41", hasActiveStory: false },
      },
      {
        id: "notif-4",
        type: "like_multi",
        isNew: false,
        timestamp: "3d",
        users: [
          { id: "u5", username: "sam.studio", avatarUrl: "https://i.pravatar.cc/150?u=52", hasActiveStory: true },
          { id: "u6", username: "web_dev_journey", avatarUrl: "https://i.pravatar.cc/150?u=69", hasActiveStory: false },
        ],
        targetMediaUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2600&auto=format&fit=crop",
        totalLikesCount: 42,
      },
    ],
  },
];

// ─── Components ─────────────────────────────────────────────────────────────

function MultiUserLikeRow({ item }: { item: LikeMultiNotification }) {
  const [firstUser, secondUser] = item.users;
  const othersCount = item.totalLikesCount - 2;

  return (
    <li className="flex items-center justify-between py-3 border-b border-slate-100/60 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-900/40 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        {/* Avatars */}
        <div className="relative w-11 h-11 shrink-0">
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-white dark:border-black overflow-hidden z-10 bg-slate-200 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={firstUser.avatarUrl} alt={firstUser.username} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-white dark:border-black overflow-hidden z-20 bg-slate-200 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={secondUser.avatarUrl} alt={secondUser.username} className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Text */}
        <div className="text-[14px] leading-tight text-slate-900 dark:text-slate-100 pr-2">
          <span className="font-semibold">{firstUser.username}</span>,{" "}
          <span className="font-semibold">{secondUser.username}</span>
          {othersCount > 0 && <span> and <span className="font-semibold">{othersCount} others</span></span>}{" "}
          liked your story.
          <span className="text-slate-400 dark:text-slate-500 text-sm ml-1.5">{item.timestamp}</span>
        </div>
      </div>
      
      {/* Media Preview */}
      <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ml-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.targetMediaUrl} alt="Post preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
    </li>
  );
}

function FollowRow({ item }: { item: FollowNotification }) {
  const [followState, setFollowState] = useState<"follow_back" | "following">(item.type);

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowState((prev) => (prev === "follow_back" ? "following" : "follow_back"));
  };

  return (
    <li className="flex items-center justify-between py-3 border-b border-slate-100/60 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-900/40 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className={`w-11 h-11 rounded-full p-[2px] ${
              item.user.hasActiveStory ? "bg-gradient-to-tr from-yellow-400 to-fuchsia-600" : ""
            }`}
          >
            <div className="w-full h-full rounded-full border-2 border-white dark:border-black overflow-hidden bg-slate-200 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.user.avatarUrl} alt={item.user.username} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-[14px] leading-tight text-slate-900 dark:text-slate-100 pr-2">
          <span className="font-semibold">{item.user.username}</span> started following you.
          <span className="text-slate-400 dark:text-slate-500 text-sm ml-1.5">{item.timestamp}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="shrink-0 ml-2">
        {followState === "follow_back" ? (
          <button
            onClick={handleFollowToggle}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
          >
            Follow Back
          </button>
        ) : (
          <button
            onClick={handleFollowToggle}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold px-5 py-1.5 rounded-lg transition-all active:scale-95"
          >
            Following
          </button>
        )}
      </div>
    </li>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All");
  const filters: NotificationFilter[] = ["All", "People you follow", "Comments", "Follows"];

  return (
    <main className="w-full h-full min-h-screen bg-ig-bg overflow-y-auto">
      {/* ── Sticky Top Bar (Explore Style) ── */}
      <div className="sticky top-0 z-20 bg-ig-bg/95 backdrop-blur-md border-b border-ig-border">
        <div className="px-4 py-2.5 flex items-center gap-3 max-w-2xl mx-auto">
          <SearchBar
            value=""
            onDebouncedChange={() => {}}
            placeholder="🔍  Поиск"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-20">
        
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Notifications
          </h1>
        </header>

        {/* Filters */}
        <section className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 md:mx-0 md:px-0">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-slate-950 dark:bg-white text-white dark:text-black border border-transparent shadow-sm"
                      : "bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </section>

        {/* Feed */}
        <section className="flex flex-col gap-6">
          {MOCK_DATA.map((group) => (
            <div key={group.label}>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 mt-2">
                {group.label}
              </h2>
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  if (item.type === "like_multi") {
                    return <MultiUserLikeRow key={item.id} item={item} />;
                  }
                  if (item.type === "follow_back" || item.type === "following") {
                    return <FollowRow key={item.id} item={item} />;
                  }
                  return null;
                })}
              </ul>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
