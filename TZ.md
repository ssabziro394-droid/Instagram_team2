# Техническое Задание (ТЗ) — Клон Instagram

## 1. Описание проекта
Проект представляет собой полноценное веб-приложение — клон Instagram, реализующее основные функции социальной сети. Для минимизации конфликтов слияния (merge conflicts) при параллельной командной разработке проект жестко разбит на независимые файловые структуры и использует инъекцию эндпоинтов в RTK Query.

## 2. Технологический стек
- **Frontend**: Next.js 16 (App Router, React 19)
- **Управление состоянием и API**: Redux Toolkit (RTK) и RTK Query
  - Главный API-клиент находится в `store/api/baseApi.ts`.
  - Каждый разработчик расширяет его с помощью `baseApi.injectEndpoints({ ... })` в своем отдельном файле!
- **Стилизация**: Tailwind CSS v4
- **Формы и Валидация**: React Hook Form + Zod
- **Иконки**: Lucide React
- **Анимации**: Framer Motion

---

## 3. Матрица ответственности и разграничение файлов
Чтобы избежать git-конфликтов, каждый разработчик работает **строго в своих файлах и папках**.

| Разработчик | Зона ответственности (Модули) | Папки компонентов | Маршруты (Pages/Layouts) | RTK Query файлы |
| :--- | :--- | :--- | :--- | :--- |
| **Amirjon (TL)** | Главная лента, Создание постов | `components/feed/`, `components/create/` | `app/(root)/page.tsx` | `store/api/feedApi.ts` |
| **Idiboy** | Лента Reels (видео) | `components/reels/` | `app/(root)/reels/page.tsx` | `store/api/reelsApi.ts` |
| **Yosin** | Авторизация, Чаты (Личные сообщения) | `components/auth/`, `components/chat/` | `app/(auth)/*`, `app/(root)/messages/*` | `store/api/authApi.ts`, `store/api/chatApi.ts`, `store/slices/authSlice.ts` |
| **Ismoil** | Профиль пользователя, Поиск | `components/profile/`, `components/search/` | `app/(root)/[username]/*`, `app/(root)/explore/*` | `store/api/profileApi.ts`, `store/api/searchApi.ts` |

---

## 4. Общие правила разработки
1. **Никто не правит `store/api/baseApi.ts` напрямую** (кроме Team Lead при первоначальной настройке). Все запросы пишутся через `baseApi.injectEndpoints` в ваших личных файлах.
2. **Никто не правит `store/store.ts` напрямую**. Если нужно подключить обычный slice (например, для Auth), согласуйте это с Team Lead.
3. Разработчики создают свои компоненты внутри назначенных им папок в `components/`. Общие UI элементы (кнопки, инпуты) создаются в `components/ui/` только по согласованию.
4. **Коммиты и ветки**:
   - Название веток: `feature/feed-amirjon`, `feature/reels-idiboy`, `feature/auth-yosin`, `feature/profile-ismoil`.
   - Запрещено пушить напрямую в `main` или `develop`. Все изменения вливаются только через PR с ревью от Team Lead.
