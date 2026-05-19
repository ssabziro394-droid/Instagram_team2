import React from "react";

export default function ReelsPage() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full aspect-[9/16] max-h-[85vh] border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Раздел Reels</h1>
        <p className="text-zinc-400 text-sm">Здесь будут отображаться вертикальные видео ролики.</p>
      </div>
    </div>
  );
}
