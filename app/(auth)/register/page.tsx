import React from "react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <form className="w-full flex flex-col gap-3">
      <p className="text-zinc-500 text-xs font-semibold text-center mb-2">
        Зарегистрируйтесь, чтобы смотреть фото и видео ваших друзей.
      </p>
      
      <input 
        type="email" 
        placeholder="Электронный адрес" 
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
      />
      <input 
        type="text" 
        placeholder="Имя и фамилия" 
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
      />
      <input 
        type="text" 
        placeholder="Имя пользователя" 
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
      />
      <input 
        type="password" 
        placeholder="Пароль" 
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
      />
      
      <button 
        type="button" 
        className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded py-2 text-sm font-semibold transition mt-2"
      >
        Регистрация
      </button>

      <div className="flex items-center my-4 gap-4 w-full">
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
        <span className="text-xs text-zinc-500 font-semibold uppercase">ИЛИ</span>
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-zinc-400">Есть аккаунт? </span>
        <Link href="/login" className="text-sky-500 font-semibold hover:underline">
          Вход
        </Link>
      </div>
    </form>
  );
}
