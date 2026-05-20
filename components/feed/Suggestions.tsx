"use client";

import React from "react";

const SUGGESTIONS = [
  { id: 1, username: "tom_hardy", name: "Tom Hardy", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", relation: "Popular" },
  { id: 2, username: "sofia_dev", name: "Sofia Smith", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", relation: "Follows you" },
  { id: 3, username: "nextjs_master", name: "NextJS Master", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", relation: "Followed by tom11" },
  { id: 4, username: "softclub_tj", name: "Softclub Academy", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", relation: "New to Instagram" },
];

export default function Suggestions() {
  return (
    <div className="w-full max-w-[320px] flex flex-col gap-5 py-4 px-2">
      {/* Current User */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Current user"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-zinc-100 hover:underline cursor-pointer">
              administrator
            </span>
            <span className="text-xs text-zinc-500">
              SoftClub Administrator
            </span>
          </div>
        </div>
        <button className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors">
          Switch
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 font-semibold text-sm">Suggestions for you</span>
        <button className="text-zinc-200 text-xs font-semibold hover:text-zinc-400 transition-colors">
          See All
        </button>
      </div>

      {/* Suggestions list */}
      <div className="flex flex-col gap-3.5">
        {SUGGESTIONS.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-850 bg-zinc-900">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-zinc-200 hover:underline cursor-pointer">
                  {user.username}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {user.relation}
                </span>
              </div>
            </div>
            <button className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors">
              Follow
            </button>
          </div>
        ))}
      </div>

      {/* Footer copyright */}
      <div className="flex flex-col gap-3 text-[10px] text-zinc-600 mt-6 leading-relaxed">
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          {["About", "Help", "Press", "API", "Jobs", "Privacy", "Terms", "Locations", "Language"].map((item, idx) => (
            <span key={idx} className="hover:underline cursor-pointer">{item}</span>
          ))}
        </div>
        <span>© 2026 INSTAGRAM CLONE FROM SOFTCLUB</span>
      </div>
    </div>
  );
}
