# Telegram Stars Leaderboard

Next.js (App Router) + Supabase + Vercel + Tailwind + Vitest. Telegram WebApp с лидербордом по звёздам, депозитами и выводом через 21 день.

## ⚙️ Быстрый старт локально

```bash
git clone YOUR_FORK_URL stars-leaderboard
cd stars-leaderboard
cp .env.example .env.local   # заполните ключи
npm i
npm run test                 # юнит-тесты логики вывода
npm run dev                  # http://localhost:3000
```

### Переменные окружения (.env.local)

- `NEXT_PUBLIC_SUPABASE_URL` — URL проекта Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (public)
- `SUPABASE_SERVICE_ROLE` — service role key (секрет, для API-роутов)
- `TELEGRAM_BOT_TOKEN` — токен бота для проверки подписи initData

## 🗄️ Настройка Supabase

1. Создайте проект в Supabase.
2. Откройте **SQL** → вставьте содержимое `supabase.sql` → **Run**.
3. В **Settings → API** скопируйте `anon` и `service role` ключи → добавьте в `.env.local`.

## 🚀 Деплой на Vercel

1. Создайте новый репозиторий на GitHub и запушьте код (см. ниже).
2. В Vercel → **New Project** → импортируйте репо.
3. Задайте Env Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`, `TELEGRAM_BOT_TOKEN`.
4. Deploy (Build: `next build`).

## 🤖 Telegram WebApp

- Создайте бота у BotFather → получите `TELEGRAM_BOT_TOKEN`.
- В BotFather настройте Web App кнопки (`/setwebapp`) на ваш Vercel-URL.
- Приложение в браузере тоже откроется, но верификация initData проходит только внутри Telegram.

> Депозиты сейчас фейковые (запись в БД). Для реальных **Stars** интегрируйте invoice в `doDeposit()` и вызывайте `/api/deposit` по факту оплаты.

## 🧪 Тесты

```
npm run test
```

Покрывают вычисление доступной суммы к выводу (21 день блокировки).

## 📦 Публикация в GitHub

```bash
git init
git add .
git commit -m "Initial commit: Stars Leaderboard"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

## 🔒 Безопасность и RLS

- Анонимному клиенту разрешён только **SELECT** (лидерборд/статистика).
- Все записи (депозит/вывод/профиль) идут через API-роуты с `SUPABASE_SERVICE_ROLE`.
- Проверка `initData` выполняется на Node runtime (`/api/telegram/verify`).

## 📁 Структура

```
app/
  api/...
  lib/telegram.ts
  page.tsx
  globals.css
components/ui.tsx
lib/{supabaseClient,utils,withdraw}.ts
tests/withdraw.test.ts
supabase.sql
tailwind.config.ts
postcss.config.js
```

## 🧭 Дальше можно добавить

- Настоящие платежи Telegram Stars (invoice + validation)
- Админ-панель, модерация никнеймов, баннеры
- Лёгкие автовыплаты или webhook-уведомления
