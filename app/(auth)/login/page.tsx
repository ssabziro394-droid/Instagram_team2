"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation } from "@/store/api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  userName: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await login(data).unwrap();

      // The API returns { data: token, statusCode: 200 }
      if (response?.data) {
        dispatch(setCredentials({ token: response.data }));
        router.replace("/");
      } else if (response?.errors?.length) {
        setServerError(response.errors.join(", "));
      }
    } catch (err: any) {
      setServerError(
        err?.data?.errors?.join(", ") ||
          err?.data?.title ||
          "Ошибка при входе. Проверьте данные.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-3"
    >
      {serverError && (
        <div className="text-red-500 text-xs text-center mb-2">
          {serverError}
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Имя пользователя"
          {...register("userName")}
          className={`w-full bg-zinc-900 border ${errors.userName ? "border-red-500" : "border-zinc-800"} rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700`}
        />
        {errors.userName && (
          <p className="text-red-500 text-[10px] mt-1">
            {errors.userName.message}
          </p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Пароль"
          {...register("password")}
          className={`w-full bg-zinc-900 border ${errors.password ? "border-red-500" : "border-zinc-800"} rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700`}
        />
        {errors.password && (
          <p className="text-red-500 text-[10px] mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-sky-500 text-white rounded py-2 text-sm font-semibold transition mt-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Войти
      </button>

      <div className="flex items-center my-4 gap-4 w-full">
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
        <span className="text-xs text-zinc-500 font-semibold uppercase">
          ИЛИ
        </span>
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-zinc-400">Еще нет аккаунта? </span>
        <Link
          href="/register"
          className="text-sky-500 font-semibold hover:underline"
        >
          Зарегистрироваться
        </Link>
      </div>
    </form>
  );
}
