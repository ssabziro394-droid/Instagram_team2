"use client";

import { useRef, useState } from "react";
import {
  X,
  Loader2,
  Search,
  User2,
  ShieldCheck,
  Megaphone,
  ChevronRight,
  Smile,
} from "lucide-react";
import {
  useUpdateUserImageProfileMutation,
  useDeleteUserImageProfileMutation,
} from "@/store/api/profileApi";
import type { UpdateUserProfileRequest, UserProfile } from "@/types/profile";

type EditProfileModalProps = {
  profile: UserProfile;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: UpdateUserProfileRequest) => Promise<void> | void;
};

function getUsername(profile: UserProfile) {
  return profile.username ?? profile.userName ?? "";
}

function getFullName(profile: UserProfile) {
  return (
    profile.fullName ??
    profile.name ??
    [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  );
}

function getBio(profile: UserProfile) {
  return profile.bio ?? profile.about ?? "";
}

function normalizeAvatarUrl(value?: string) {
  if (!value) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  const cleanValue = value.replace(/^\/+/, "");
  if (cleanValue.startsWith("images/")) {
    return `https://instagram-api.softclub.tj/${cleanValue}`;
  }

  return `https://instagram-api.softclub.tj/images/${cleanValue}`;
}

function MetaLogo() {
  return (
    <svg className="h-4 w-4 text-sky-500 fill-current" viewBox="0 0 24 24">
      <path d="M16.5 6c-1.8 0-3.3 1.1-4.1 2.7-.8-1.6-2.3-2.7-4.1-2.7C5.1 6 3 8.1 3 10.7c0 4.1 4.5 7.7 8.3 10.3.4.3.9.3 1.3 0 3.8-2.6 8.3-6.2 8.3-10.3C21 8.1 18.9 6 16.5 6zm-8.2 8C6.1 14 4.8 12.5 4.8 10.7c0-1.8 1.3-3.2 3.5-3.2 2.1 0 3.5 1.4 3.5 3.2 0 1.8-1.4 3.3-3.5 3.3zm8.2 0c-2.1 0-3.5-1.5-3.5-3.3 0-1.8 1.4-3.2 3.5-3.2 2.2 0 3.5 1.4 3.5 3.2 0 1.8-1.3 3.3-3.5 3.3z" />
    </svg>
  );
}

function getGenderLabel(genderValue?: string | number) {
  if (genderValue === undefined || genderValue === null) {
    return "Мужской";
  }
  const val = String(genderValue).trim();
  if (val === "0" || val.toLowerCase() === "male" || val === "Мужской") {
    return "Мужской";
  }
  if (val === "1" || val.toLowerCase() === "female" || val === "Женский") {
    return "Женский";
  }
  return "Не указано";
}

export default function EditProfileModal({
  profile,
  isSaving = false,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(getUsername(profile));
  const [fullName, setFullName] = useState(getFullName(profile));
  const [bio, setBio] = useState(getBio(profile));
  const [gender, setGender] = useState(getGenderLabel(profile.gender));
  const [website, setWebsite] = useState("");
  const [showThreads, setShowThreads] = useState(false);
  const [recommendations, setRecommendations] = useState(true);

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [updateUserImage, { isLoading: isUploading }] = useUpdateUserImageProfileMutation();
  const [deleteUserImage, { isLoading: isDeleting }] = useDeleteUserImageProfileMutation();

  const currentAvatarUrl = normalizeAvatarUrl(
    profile.avatar || profile.image || profile.avatarUrl || profile.imageUrl || ""
  );

  const handlePhotoClick = () => {
    if (currentAvatarUrl) {
      setShowPhotoOptions(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorText("");
    setShowPhotoOptions(false);

    try {
      const formData = new FormData();
      formData.append("imageFile", file);
      await updateUserImage(formData).unwrap();
    } catch (err) {
      setErrorText("Не удалось обновить фото профиля.");
      console.error(err);
    }
  };

  const handleDeletePhoto = async () => {
    setErrorText("");
    setShowPhotoOptions(false);
    try {
      await deleteUserImage().unwrap();
    } catch (err) {
      setErrorText("Не удалось удалить фото профиля.");
      console.error(err);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorText("");

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await onSave({
        id: profile.id,
        userId: profile.userId,
        username: username.trim(),
        userName: username.trim(),
        firstName,
        lastName,
        fullName: fullName.trim(),
        bio: bio.trim(),
        about: bio.trim(),
        gender: gender,
      });
    } catch (err) {
      setErrorText("Не удалось сохранить изменения.");
    }
  };

  const sidebarGroups = [
    {
      group: "Как вы используете Instagram",
      items: [
        { label: "Редактировать профиль", active: true },
        { label: "Уведомления", active: false },
      ],
    },
    {
      group: "Кто может видеть ваш контент",
      items: [
        { label: "Конфиденциальность аккаунта", active: false },
        { label: "Близкие друзья", active: false },
        { label: "Заблокированные", active: false },
      ],
    },
    {
      group: "Взаимодействие с вами",
      items: [
        { label: "Сообщения и ответы на истории", active: false },
        { label: "Метки и упоминания", active: false },
        { label: "Комментарии", active: false },
        { label: "Репосты и повторное использование", active: false },
        { label: "Аккаунты с ограничениями", active: false },
        { label: "Скрытые слова", active: false },
      ],
    },
    {
      group: "Что вы видите",
      items: [
        { label: "Скрытые аккаунты", active: false },
        { label: "Настройки контента", active: false },
        { label: "Число отметок \"Нравится\" и репостов", active: false },
        { label: "Платные подписки на авторов", active: false },
      ],
    },
    {
      group: "Ваше приложение и медиафайлы",
      items: [
        { label: "Архивирование и скачивание", active: false },
        { label: "Специальные возможности", active: false },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 md:px-10">
      {/* Viewport Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex items-center justify-center rounded-full p-2 text-white/70 hover:bg-zinc-900/60 hover:text-white transition"
        aria-label="Close settings"
      >
        <X className="h-7 w-7" />
      </button>

      {/* Main Container */}
      <div className="relative flex h-[90vh] max-h-[850px] w-full max-w-6xl overflow-hidden rounded-xl border border-zinc-800 bg-black text-white shadow-2xl">
        
        {/* Left Side: Settings Navigation Sidebar (hidden on mobile, flex on desktop) */}
        <div className="hidden w-[310px] shrink-0 flex-col border-r border-zinc-900 bg-black p-5 overflow-y-auto select-none gap-5">
          <h2 className="text-xl font-bold text-white px-2">Настройки</h2>

          {/* Search Box */}
          <div className="relative mx-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Поисковый запрос"
              disabled
              className="w-full rounded-lg bg-zinc-900 py-2 pl-9 pr-4 text-xs text-zinc-400 placeholder-zinc-500 outline-none cursor-not-allowed"
            />
          </div>

          {/* Meta Accounts Center Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 mx-2 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <MetaLogo />
              <span>Meta</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-white">Центр аккаунтов</h3>
              <p className="text-[10px] leading-relaxed text-zinc-500 mt-1">
                Управляйте кросс-сервисными функциями и настройками аккаунтов на платформах Meta.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 text-[10px] text-zinc-400 mt-1">
              <li className="flex items-center gap-2">
                <User2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Личная информация</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Пароль и безопасность</span>
              </li>
              <li className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Рекламные предпочтения</span>
              </li>
            </ul>
            <button className="text-[10px] font-semibold text-sky-500 hover:text-sky-400 text-left transition mt-1.5">
              Больше настроек в Центре аккаунтов
            </button>
          </div>

          {/* Settings Groups */}
          <nav className="flex flex-col gap-4 px-2">
            {sidebarGroups.map((g, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1 px-1">
                  {g.group}
                </span>
                <ul className="flex flex-col gap-0.5">
                  {g.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <button
                        type="button"
                        className={`w-full text-left py-2 px-2.5 rounded-lg text-xs transition font-medium ${
                          item.active
                            ? "bg-zinc-900 text-white font-semibold"
                            : "text-zinc-300 hover:bg-zinc-900/40"
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Side: Settings Content Panel */}
        <div className="flex flex-1 flex-col bg-black overflow-y-auto">
          {/* Header on Mobile */}
          <div className="md:hidden flex items-center justify-between border-b border-zinc-900 px-5 py-4">
            <h2 className="text-base font-bold">Редактировать профиль</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl px-6 py-8 md:px-10 flex flex-col gap-6">
            <h2 className="hidden md:block text-xl font-bold mb-2">Редактировать профиль</h2>

            {errorText && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 py-2.5 px-4 text-center text-xs text-red-500">
                {errorText}
              </div>
            )}

            {/* User Profile Avatar Card (Insta layout) */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3">
                <div
                  onClick={handlePhotoClick}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 bg-cover bg-center text-sm font-bold text-zinc-500 transition hover:opacity-85"
                  style={
                    currentAvatarUrl
                      ? { backgroundImage: `url(${currentAvatarUrl})` }
                      : undefined
                  }
                >
                  {isUploading || isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    !currentAvatarUrl && username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs leading-none text-white">
                    {username || "User"}
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                    {fullName || ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={isUploading || isDeleting}
                className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-[11px] font-bold text-white px-4 py-1.5 rounded-lg transition"
              >
                Новое фото
              </button>
            </div>

            {/* Form Fields */}

            {/* Name and Surname */}
            <label className="flex flex-col gap-2">
              <span className="font-bold text-xs text-zinc-200">Имя и фамилия</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none transition focus:border-zinc-700 placeholder-zinc-600"
                placeholder="Имя и фамилия"
              />
            </label>

            {/* Username */}
            <label className="flex flex-col gap-2">
              <span className="font-bold text-xs text-zinc-200">Имя пользователя</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none transition focus:border-zinc-700 placeholder-zinc-600"
                placeholder="Имя пользователя"
              />
            </label>

            {/* Website Link */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-xs text-zinc-200">Сайт</span>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Сайт"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-500 outline-none cursor-not-allowed"
                disabled
              />
              <span className="text-[10px] text-zinc-500 leading-normal">
                Изменить ссылки можно только в мобильной версии. Перейдите в приложение Instagram и коснитесь “Редактировать профиль”.
              </span>
            </div>

            {/* Bio (О себе) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-zinc-200">О себе</span>
                <span className="text-[10px] text-zinc-500">{bio.length} / 150</span>
              </div>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                maxLength={150}
                placeholder="Расскажите о себе..."
                className="resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none transition focus:border-zinc-700 placeholder-zinc-600"
              />
            </div>

            {/* Show Threads Badge Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-xs text-zinc-200">Показывать значок Threads</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showThreads}
                  onChange={(e) => setShowThreads(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* Gender Select dropdown */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-xs text-zinc-200">Пол</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none transition focus:border-zinc-700 cursor-pointer"
              >
                <option value="Мужской">Мужской</option>
                <option value="Женский">Женский</option>
                <option value="Не указано">Не указано</option>
              </select>
              <span className="text-[10px] text-zinc-500 leading-normal">
                Эта информация не будет показываться в вашем общедоступном профиле.
              </span>
            </div>

            {/* Show account recommendations toggle */}
            <div className="flex items-start justify-between py-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-xs text-zinc-200">Показывать рекомендации аккаунтов в профилях</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed max-w-lg">
                  Выберите, если хотите, чтобы люди могли видеть похожие рекомендуемые аккаунты в вашем профиле, а ваш аккаунт можно было рекомендовать в других профилях.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={recommendations}
                  onChange={(e) => setRecommendations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            <div className="text-[10px] text-zinc-500 leading-relaxed py-2">
              Некоторые данные в профиле, такие как имя, биография и ссылки, видны всем.{" "}
              <button type="button" className="text-sky-500 font-semibold hover:underline">
                Посмотреть, какая информация профиля открыта
              </button>
            </div>

            {/* Submit button */}
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#0095f6] hover:bg-[#1877f2] font-semibold text-white px-8 py-2 rounded-lg text-xs transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Отправить
              </button>
            </div>
          </form>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Photo Options Sub-Modal */}
        {showPhotoOptions && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-xs overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-center shadow-2xl">
              <div className="border-b border-zinc-900 px-4 py-5">
                <h3 className="text-sm font-semibold text-white">Изменить фото профиля</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoOptions(false);
                  fileInputRef.current?.click();
                }}
                className="w-full border-b border-zinc-900 py-3 text-sm font-bold text-sky-500 hover:bg-zinc-900 transition"
              >
                Загрузить фото
              </button>
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="w-full border-b border-zinc-900 py-3 text-sm font-bold text-red-500 hover:bg-zinc-900 transition"
              >
                Удалить текущее фото
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoOptions(false)}
                className="w-full py-3 text-sm text-zinc-300 hover:bg-zinc-900 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
