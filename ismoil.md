# Техническое задание: Исмоил (Ismoil)

## Зона ответственности
Профили пользователей и глобальный поиск.

## Ваши закрепленные файлы и папки
Чтобы избежать конфликтов слияния, вы работаете **только** в следующих локациях:
- **Маршруты (Pages)**:
  - `app/(root)/[username]/page.tsx` (Профиль любого пользователя)
  - `app/(root)/explore/page.tsx` (Страница поиска и сетки рекомендованного)
- **Компоненты (Components)**:
  - `components/profile/*` (Шапка профиля, сетка публикаций, модалка редактирования)
  - `components/search/*` (Панель поиска, выпадающий список результатов)
- **API и Стейт (Redux)**:
  - `store/api/profileApi.ts` (Эндпоинты профиля пользователя)
  - `store/api/searchApi.ts` (Эндпоинты для живого поиска пользователей)

## Детальный план работ

### 1. Профиль Пользователя
- В `components/profile/` создать компоненты `ProfileHeader.tsx`, `ProfileGrid.tsx`, `EditProfileModal.tsx`.
- В `store/api/profileApi.ts` реализовать:
  - `getUserProfile` (получение данных профиля по никнейму)
  - `updateProfile` (редактирование данных)
  - `followUser` / `unfollowUser` (подписки)

### 2. Поиск пользователей
- В `components/search/` создать `SearchBar.tsx` и `SearchResults.tsx`.
- В `store/api/searchApi.ts` реализовать `searchUsers` (запрос с debounce).
- Интегрировать поиск на страницу `app/(root)/explore/page.tsx` и настроить переход в профиль при клике.
