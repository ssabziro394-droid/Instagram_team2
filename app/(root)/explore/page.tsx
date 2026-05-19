import React from "react";

export default function ExplorePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Поиск пользователей..." 
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Placeholder grids for explore */}
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-zinc-700 text-xs">Медиа {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
