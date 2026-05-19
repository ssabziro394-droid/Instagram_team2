import React from "react";

export default function ProfilePage({ params }: { params: { username: string } }) {
  // Extracting username dynamically from router
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Profile Header */}
      <div className="flex gap-8 items-center md:items-start border-b border-zinc-800 pb-8">
        <div className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-zinc-800 flex items-center justify-center text-4xl text-zinc-600">
          👤
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            <h1 className="text-xl font-semibold">Имя Пользователя</h1>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg px-4 py-1.5 text-sm transition">
              Редактировать профиль
            </button>
          </div>
          <div className="flex gap-6 text-sm">
            <span><strong>0</strong> публикаций</span>
            <span><strong>0</strong> подписчиков</span>
            <span><strong>0</strong> подписок</span>
          </div>
          <div>
            <span className="font-semibold text-sm">Полное имя</span>
            <p className="text-sm text-zinc-400">Биография пользователя...</p>
          </div>
        </div>
      </div>
      
      {/* Profile feed grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="aspect-square bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center col-span-3 h-48">
          <span className="text-zinc-500 text-sm">Публикаций пока нет</span>
        </div>
      </div>
    </div>
  );
}
