# Техническое задание: Ёсин (Yosin)

## Зона ответственности
Аутентификация (регистрация/вход) и личные сообщения (Чат / Direct).

## Ваши закрепленные файлы и папки
Чтобы избежать конфликтов слияния, вы работаете **только** в следующих локациях:
- **Маршруты (Pages)**:
  - `app/(auth)/login/page.tsx` (Вход)
  - `app/(auth)/register/page.tsx` (Регистрация)
  - `app/(auth)/layout.tsx` (Оформление страниц авторизации)
  - `app/(root)/messages/page.tsx` (Главная страница сообщений и диалогов)
- **Компоненты (Components)**:
  - `components/auth/*` (Формы входа и регистрации, валидация)
  - `components/chat/*` (Список чатов Inbox, окно сообщений ChatRoom)
- **API и Стейт (Redux)**:
  - `store/api/authApi.ts` (Мутации login и register через `baseApi.injectEndpoints`)
  - `store/api/chatApi.ts` (Получение диалогов и отправка сообщений)
  - `store/slices/authSlice.ts` (Хранение токена и данных текущего юзера в глобальном стейте)

## Детальный план работ

### 1. Авторизация
- Реализовать валидацию форм в `components/auth/` с помощью React Hook Form + Zod.
- Записать токен авторизации в `store/slices/authSlice.ts` (и в `localStorage`/куки).
- Настроить логику защиты страниц (не пускать в `(root)` без токена).

### 2. Личные сообщения (Chat)
- В `components/chat/` создать `ChatSidebar.tsx` (список диалогов) и `ChatArea.tsx` (окно переписки).
- Настроить эндпоинты в `store/api/chatApi.ts`:
  - `getChats` (загрузка диалогов)
  - `getChatMessages` (загрузка сообщений)
  - `sendMessage` (мутация отправки)
- Интегрировать чат на страницу `app/(root)/messages/page.tsx`.
