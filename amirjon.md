# Техническое задание: Амирджон (Amirjon) — Team Lead

## Зона ответственности
Главная страница (Лента/Home Feed) и создание контента (публикация постов и Reels).

## Ваши закрепленные файлы и папки
Чтобы избежать конфликтов слияния, вы работаете **только** в следующих локациях:
- **Маршруты (Pages)**:
  - `app/(root)/page.tsx` (Главная страница)
- **Компоненты (Components)**:
  - `components/feed/*` (Карточки постов, лента новостей)
  - `components/create/*` (Модальное окно загрузки фото/видео)
- **API и Стейт (Redux)**:
  - `store/api/feedApi.ts` (Все эндпоинты для ленты и создания постов через `baseApi.injectEndpoints`)

## Детальный план работ

### 1. Настройка проекта (Team Lead)
- [ ] Контроль работоспособности Next.js, Redux и Tailwind.
- [ ] Определение глобального макета Sidebar (`components/shared/Sidebar.tsx`) и BottomBar (`components/shared/BottomBar.tsx`).

### 2. Главная страница (Лента)
- Создать в `components/feed/` компоненты `PostCard.tsx`, `FeedList.tsx`.
- В `store/api/feedApi.ts` реализовать эндпоинты:
  - `getFeed` (получение постов)
  - `likePost` / `unlikePost` (лайки)
- Внедрить `FeedList` на страницу `app/(root)/page.tsx`.

### 3. Создание постов и Reels
- Создать в `components/create/` компонент `CreatePostModal.tsx`.
- В `store/api/feedApi.ts` реализовать мутации:
  - `createPost` (загрузка изображения и текста)
  - `createReel` (загрузка видео и текста)
- Реализовать триггер открытия модального окна при клике на "Create" в Sidebar/BottomBar (можно использовать query-параметр `?create=true` в URL).
