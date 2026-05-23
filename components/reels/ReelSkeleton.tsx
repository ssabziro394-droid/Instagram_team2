"use client";

import React from "react";

export default function ReelSkeleton() {
  return (
    <div className="w-full h-full flex-shrink-0 snap-start relative bg-black flex justify-center items-center overflow-hidden">
      {/* 9:16 Cinematic Container Skeleton */}
      <div className="relative w-full h-full bg-zinc-950 overflow-hidden md:max-w-[460px] md:rounded-xl md:border md:border-zinc-900/50 flex flex-col justify-between p-6">
        
        {/* Shimmer effect background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-900/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] z-0" />
        
        {/* Top Sound controller placeholder */}
        <div className="w-full flex justify-end z-10">
          <div className="w-10 h-10 rounded-full bg-zinc-900 animate-pulse" />
        </div>

        {/* Center Loading Spinner (Instagram Style) */}
        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full border-[3px] border-zinc-900 border-t-zinc-700 animate-spin z-10" />

        {/* Bottom Details and Right Actions Skeletons */}
        <div className="w-full flex justify-between items-end z-10 mt-auto">
          {/* Bottom info skeleton */}
          <div className="flex flex-col gap-3.5 w-2/3">
            {/* Avatar and Username Row */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-900 animate-pulse" />
              <div className="w-24 h-4 rounded bg-zinc-900 animate-pulse" />
              <div className="w-16 h-7 rounded-md bg-zinc-900 animate-pulse" />
            </div>

            {/* Caption lines */}
            <div className="flex flex-col gap-2">
              <div className="w-full h-3 rounded bg-zinc-900 animate-pulse" />
              <div className="w-5/6 h-3 rounded bg-zinc-900 animate-pulse" />
            </div>

            {/* Audio track line */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded-full bg-zinc-900 animate-pulse" />
              <div className="w-32 h-3.5 rounded bg-zinc-900 animate-pulse" />
            </div>
          </div>

          {/* Right sidebar actions skeleton */}
          <div className="flex flex-col items-center gap-5 w-12">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-full bg-zinc-900 animate-pulse" />
                <div className="w-6 h-3 rounded bg-zinc-900 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
