import React from "react";

export default function MessagesPage() {
  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold">Сообщения</h1>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-zinc-500 text-sm p-4 text-center">
          Нет активных чатов
        </div>
      </div>
      
      {/* Active Chat view */}
      <div className="flex-1 flex flex-col justify-center items-center bg-black text-center p-6">
        <h2 className="text-lg font-semibold">Ваши сообщения</h2>
        <p className="text-zinc-500 text-sm mt-1">Отправляйте личные фото и сообщения другу или группе.</p>
        <button className="mt-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition">
          Отправить сообщение
        </button>
      </div>
    </div>
  );
}
