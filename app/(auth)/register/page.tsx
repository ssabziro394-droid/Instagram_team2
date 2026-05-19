"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterMutation } from "@/store/api/authApi";
import { Loader2 } from "lucide-react";

const registerSchema = z
  .object({
    email: z.string().email("Введите корректный email"),
    fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
    userName: z
      .string()
      .min(3, "Имя пользователя должно содержать минимум 3 символа"),
    password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
    confirmPassword: z.string().min(6, "Пароль должен быть минимум 6 символов"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await registerUser(data).unwrap();

      // If there are errors in response body
      if (response?.errors?.length) {
        setServerError(response.errors.join(", "));
        return;
      }

      router.push("/login");
    } catch (err: any) {
      setServerError(
        err?.data?.errors?.join(", ") ||
          err?.data?.title ||
          "Ошибка при регистрации. Проверьте данные.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-3"
    >
      <p className="text-zinc-500 text-xs font-semibold text-center mb-2">
        Зарегистрируйтесь, чтобы смотреть фото и видео ваших друзей.
      </p>

      {serverError && (
        <div className="text-red-500 text-xs text-center mb-2">
          {serverError}
        </div>
      )}

      <div>
        <input
          type="email"
          placeholder="Электронный адрес"
          {...register("email")}
          className={`w-full bg-zinc-900 border ${errors.email ? "border-red-500" : "border-zinc-800"} rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700`}
        />
        {errors.email && (
          <p className="text-red-500 text-[10px] mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="Имя и фамилия"
          {...register("fullName")}
          className={`w-full bg-zinc-900 border ${errors.fullName ? "border-red-500" : "border-zinc-800"} rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700`}
        />
        {errors.fullName && (
          <p className="text-red-500 text-[10px] mt-1">
            {errors.fullName.message}
          </p>
        )}
      </div>

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

      <div>
        <input
          type="password"
          placeholder="Подтвердите пароль"
          {...register("confirmPassword")}
          className={`w-full bg-zinc-900 border ${errors.confirmPassword ? "border-red-500" : "border-zinc-800"} rounded px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700`}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-[10px] mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:hover:bg-sky-500 text-white rounded py-2 text-sm font-semibold transition mt-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Регистрация
      </button>

      <div className="flex items-center my-4 gap-4 w-full">
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
        <span className="text-xs text-zinc-500 font-semibold uppercase">
          ИЛИ
        </span>
        <div className="h-[1px] bg-zinc-800 flex-1"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-zinc-400">Есть аккаунт? </span>
        <Link
          href="/login"
          className="text-sky-500 font-semibold hover:underline"
        >
          Вход
        </Link>
      </div>
    </form>
  );
}
