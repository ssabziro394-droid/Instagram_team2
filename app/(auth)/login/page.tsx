import React from "react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <form className="w-full flex flex-col gap-3">
      <input 
        type="text" 
        placeholder="Телефон, имя пользователя или эл. адрес" 
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
        Войти
      </button>

      <div className="flex items-center my-4 gap-4 w-full">
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
        <span className="text-xs text-zinc-500 font-semibold uppercase">ИЛИ</span>
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-zinc-400">Еще нет аккаунта? </span>
        <Link href="/register" className="text-sky-500 font-semibold hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </form>
  );
}
