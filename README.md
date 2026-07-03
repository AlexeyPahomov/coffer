# Coffer

Персональный трекер финансов с envelope-бюджетированием: учёт доходов, распределение по категориям, расходы, планирование крупных трат и месячное закрытие бюджета.

Монорепозиторий на **pnpm workspaces**: фронтенд и бэкенд в `apps/*`, общая доменная логика — в `packages/*`.

## Возможности

- **Доходы** — учёт поступлений за период
- **Allocation** — распределение дохода по категориям (конверты)
- **Расходы** — траты по категориям с оперативным балансом
- **Planning** — планируемые траты, резервирование ликвидности, прогноз по месяцам и прогноз результата «если продолжу как сейчас» на 3/6/12 месяцев (свободный пул + накопления)
- **Категории** — настройка типов, иконок, политики переноса остатка (`RESET` / `CARRY` / `TRANSFER_TO_FREE`)
- **Бюджетный месяц** — снимки (`CategoryMonthSnapshot`), проекции и отчёт при закрытии месяца

## Стек

| Слой | Технологии |
|------|------------|
| **Клиент** | React 19, TypeScript, Vite 8, React Router 7, TanStack Query, Tailwind CSS 4, Radix UI / shadcn, date-fns, Embla Carousel |
| **Сервер** | NestJS 11, TypeScript, Prisma 7, PostgreSQL (`pg` + `@prisma/adapter-pg`) |
| **Общие пакеты** | `@coffer/shared` — типы и расчёты конвертов; `@coffer/planning-core` — прогноз и проекции |
| **База данных** | PostgreSQL (Supabase, connection pooler) |
| **Версионирование** | [standard-version](https://github.com/conventional-changelog/standard-version), Conventional Commits |

## Структура репозитория

```
coffer/
├── apps/
│   ├── client/          # SPA (Vite + React, FSD-архитектура)
│   └── server/          # REST API (NestJS + Prisma)
├── packages/
│   ├── shared/          # @coffer/shared — доменные типы и envelope-математика
│   └── planning-core/   # @coffer/planning-core — прогноз, резервы, carry-over
├── docs/adr/            # архитектурные решения (ADR)
├── .env.example         # шаблон переменных окружения
├── .versionrc.json      # конфиг standard-version
└── CHANGELOG.md         # история релизов
```

### Клиент (`apps/client`)

Feature-Sliced Design: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.

Маршруты: `/income`, `/allocation`, `/expenses`, `/planning`, `/categories` (по умолчанию — `/planning`).

### Сервер (`apps/server`)

REST-модули NestJS:

| Контроллер | Назначение |
|------------|------------|
| `income` | доходы |
| `allocation` | бюджет |
| `category` | категории |
| `expense` | расходы |
| `planned-expense` | планируемые траты |
| `budget-months` | бюджетные месяцы, снимки, закрытие |

Prisma-схема: `apps/server/prisma/schema.prisma`. Клиент генерируется в `apps/server/src/generated/prisma`.

### Общие пакеты

- **`@coffer/shared`** — периоды, конверты, деньги, иконки; используется клиентом и сервером
- **`@coffer/planning-core`** — `projectMonthBudget`, прогноз по цепочке месяцев; сервер делегирует через `ProjectionService`, клиент — через `processes/forecasting`

Подробнее: [docs/adr/001-budget-projections.md](docs/adr/001-budget-projections.md), [docs/adr/002-planning-bounded-context.md](docs/adr/002-planning-bounded-context.md), [docs/adr/003-outcome-forecasting.md](docs/adr/003-outcome-forecasting.md).

## Инфраструктура

```
┌─────────────┐     /api (proxy)      ┌─────────────┐     Prisma/pg      ┌──────────────┐
│   Browser   │ ────────────────────► │  NestJS     │ ─────────────────► │  PostgreSQL  │
│  Vite :5173 │                       │  :3000      │                    │  (Supabase)  │
└─────────────┘                       └─────────────┘                    └──────────────┘
```

- **Локальная разработка:** Vite проксирует `/api` → `http://localhost:3000` (см. `apps/client/vite.config.ts`)
- **Production API:** задаётся через `VITE_API_URL` в клиенте
- **БД:** Supabase PostgreSQL через pooler (Transaction mode, порт `6543` для dev — см. `.env.example`)
- **CI / Docker / Husky:** в проекте не настроены

## Требования

- Node.js (рекомендуется LTS)
- pnpm (см. `packageManager` в корневом `package.json`)
- Доступ к PostgreSQL (Supabase или локальный инстанс)

## Быстрый старт

### 1. Установка

Из корня репозитория:

```bash
pnpm install
```

При установке сервер автоматически выполняет `prisma generate` (postinstall).

### 2. Переменные окружения

Шаблон — [.env.example](.env.example). Значения разносятся по приложениям:

**`apps/client/.env`**

```env
VITE_APP_NAME=Coffer
# VITE_API_URL=https://api.example.com   # только для production-сборки
```

**`apps/server/.env`**

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
# Только для prisma migrate (DDL): тот же хост, порт 5432 (session mode).
DATABASE_URL_MIGRATE=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
DATABASE_PASS=<PASSWORD>
PORT=3000
# DATABASE_SSL_REJECT_UNAUTHORIZED=false   # при ошибках SSL в dev
```

Не коммитьте `.env` с реальными секретами.

### 3. Миграции БД

```bash
pnpm --filter server db:migrate
```

Или из каталога сервера:

```bash
cd apps/server && pnpm db:migrate
```

Рантайм ходит в БД через транзакционный pooler (`:6543`), но `prisma migrate`
требует session-соединение — движок миграций держит DDL и advisory-локи, которых
pgbouncer на `:6543` не даёт. Поэтому `prisma.config.ts` берёт datasource из
`DATABASE_URL_MIGRATE` (Session pooler, `:5432`) с фолбэком на `DATABASE_URL_DIRECT`
и `DATABASE_URL`. Прод-база была забэйзлайнена (`prisma migrate resolve --applied`
по всем существующим миграциям), поэтому `db:migrate` теперь применяет только новые.

### 4. Запуск

Из **корня** (удобно для параллельной работы):

```bash
pnpm dev              # клиент + сервер параллельно
pnpm dev:server       # только NestJS, watch-режим
pnpm dev:client       # только Vite dev server
```

Или из каталогов приложений:

```bash
# Сервер
cd apps/server && pnpm dev

# Клиент
cd apps/client && pnpm dev
```

| Сервис | URL по умолчанию |
|--------|------------------|
| Клиент | http://localhost:5173 |
| API | http://localhost:3000 |

## Команды

### Корень репозитория

| Команда | Описание |
|---------|----------|
| `pnpm dev` | клиент и сервер параллельно |
| `pnpm dev:client` | клиент в режиме разработки |
| `pnpm dev:server` | сервер в watch-режиме |
| `pnpm build` | production-сборка всех workspace-пакетов |
| `pnpm start` | production-старт сервера |
| `pnpm release` | релиз (standard-version: bump, changelog, тег) |
| `pnpm release:patch` | принудительный patch-bump |
| `pnpm release:minor` | принудительный minor-bump |
| `pnpm release:major` | принудительный major-bump |

### Клиент (`apps/client`)

| Команда | Описание |
|---------|----------|
| `pnpm dev` | dev-сервер Vite |
| `pnpm build` | production-сборка |
| `pnpm preview` | просмотр production-сборки |
| `pnpm lint` | ESLint |

### Сервер (`apps/server`)

| Команда | Описание |
|---------|----------|
| `pnpm dev` | разработка с перезапуском |
| `pnpm start` | старт без watch |
| `pnpm start:prod` | production (`node dist/main.js`) |
| `pnpm build` | сборка NestJS |
| `pnpm db:generate` | `prisma generate` + patch клиента |
| `pnpm db:migrate` | `prisma migrate deploy` |
| `pnpm test` | unit-тесты (Jest) |
| `pnpm test:e2e` | e2e-тесты |
| `pnpm lint` | ESLint |

### Пакеты (`packages/*`)

```bash
pnpm build:deps
pnpm --filter @coffer/shared test
pnpm --filter @coffer/planning-core test
```

## Релизы

Версия и changelog ведутся через **standard-version** в корне.

1. Убедитесь, что рабочая директория чистая: `git status`
2. Коммиты в повседневной работе — в формате Conventional Commits (`feat:`, `fix:`, `feat!:` для breaking changes)
3. Релиз:

```bash
pnpm release
git push --follow-tags origin main
```

Первый релиз (changelog без смены версии):

```bash
pnpm release -- --first-release
```

Релизный коммит: `release: 🚀vX.Y.Z` (см. `.versionrc.json`).

## Лицензия

ISC (корневой `package.json`).
