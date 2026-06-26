# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Обзор

Coffer — персональный трекер финансов с envelope-бюджетированием (конверты). Монорепозиторий на **pnpm workspaces**:

- `apps/client` — SPA (Vite + React 19, Feature-Sliced Design)
- `apps/server` — REST API (NestJS 11 + Prisma 7 + PostgreSQL)
- `packages/shared` (`@coffer/shared`) — доменные типы и envelope-математика
- `packages/planning-core` (`@coffer/planning-core`) — прогноз, резервы, carry-over по цепочке месяцев

README.md содержит подробный onboarding; здесь — только то, что не видно из структуры файлов.

## Команды

Из корня репозитория:

```bash
pnpm dev              # клиент + сервер параллельно
pnpm dev:server       # только NestJS (watch)
pnpm dev:client       # только Vite
pnpm build            # сборка всех workspace-пакетов (pnpm -r build)
pnpm build:deps       # ТОЛЬКО shared + planning-core (см. ниже)
pnpm typecheck        # build:deps, затем tsc --noEmit во всех пакетах
```

Сервер (`apps/server`):

```bash
pnpm --filter server db:migrate     # prisma migrate deploy
pnpm --filter server db:generate    # prisma generate + patch (см. ниже)
pnpm --filter server test           # Jest unit (файлы *.spec.ts рядом с кодом)
pnpm --filter server test:e2e       # e2e (test/jest-e2e.json)
pnpm --filter server lint           # eslint --fix
```

Запуск одного теста сервера: `pnpm --filter server test -- expense.service` (Jest по подстроке имени файла).

Доменные пакеты (тесты на `node --test`, не Jest):

```bash
pnpm --filter @coffer/shared test
pnpm --filter @coffer/planning-core test
```

**`pre-push` hook (husky)** запускает `pnpm run typecheck` — пуш падает при ошибках типов.

## Критичные особенности сборки

- **`build:deps` обязателен перед запуском/сборкой app.** `@coffer/shared` и `@coffer/planning-core` поставляются как скомпилированный `dist`, а не как исходники. Скрипты `dev`/`build`/`start` сервера сами вызывают `pnpm -w run build:deps` первым шагом. Если меняешь код в `packages/*`, пересобери их, иначе app увидит старую версию.
- **`patch-prisma-client.cjs` запускается после каждого `prisma generate`** (postinstall, db:generate, dev, start, build). Prisma 7 генерирует `client.ts` с `import.meta.url`, что ломает CJS-сборку Nest (`exports is not defined`). Скрипт подменяет на `__dirname`. Не удаляй этот шаг.
- Сгенерированный Prisma-клиент лежит в `apps/server/src/generated/prisma` (в репозитории, импортируется как относительный путь).

## Архитектура бюджета (ключевое — читай ADR)

Источник правды — `docs/adr/001-budget-projections.md` и `docs/adr/002-planning-bounded-context.md`. Суть:

**Три слоя данных:**
- **События** (source of truth): `Income`, `Allocation`, `Expense` — их мутирует пользователь.
- **Проекции** (denormalized): `BudgetMonth`, `CategoryMonthSnapshot` — пересчитываются автоматически.
- **Неизменяемый артефакт закрытия**: `MonthCloseReport`.

**Проекции нельзя править напрямую.** Только через:
1. `BudgetProjectorService` — инкрементальные дельты после мутации события (`onExpenseCreated/Updated/Removed`, `onAllocation*`).
2. `rebuildFrom` / rebuild-сервис — детерминированный идемпотентный пересчёт цепочки месяцев от заданного периода.

**Правила снапшота:**
- `closing_balance` считается ТОЛЬКО через `computeClosing(opening, allocated, spent)` из `@coffer/shared` — никогда `closing += delta`.
- `overspent` НЕ хранится: используй `closing_balance < 0` / хелперы DTO.
- `opening_balance`/`allocated`/`spent` обновляются инкрементально (`version` инкрементится как optimistic-lock).

**Статус месяца:** `OPEN` (события правят проекции) / `CLOSED` (проекции заморожены, мутации периода отклоняются). Reopen ставит `OPEN` и запускает rebuild от этого месяца вперёд. Месяцы создаются явным `POST /budget-months/:period/open`, не авто-создаются при чтении.

**Forecasting ≠ reporting.** «Что произошло» — `entities/budget`, summary-DTO. «Что произойдёт» — `@coffer/planning-core` (`projectMonthBudget`, `buildForecastChain` — последовательная передача ликвидности, не независимый `map`). Логика прогноза НЕ должна попадать в `@coffer/shared` (он держится domain-light).

**Client/server parity:** вся closing-математика живёт в `@coffer/shared` и используется одинаково клиентом (derive) и сервером (projector). Не дублируй формулы — импортируй.

## Сервер: конвенции

- **Нет аутентификации.** Временный пользователь — `DEV_USER_ID` в `apps/server/src/lib/dev-user.ts`. Контроллеры берут `user_id` из query-параметра (`@Query('user_id')`) и валидируют его наличие.
- **Никаких интерактивных `$transaction`.** Supabase pooler (Transaction mode, порт 6543) их не поддерживает. Поэтому проектор делает отдельные запросы; тип БД-клиента — `BudgetDbClient` (`Prisma.TransactionClient | PrismaService`) в `budget/budget-db.ts`. Ретраи — `prisma/db-retry.ts`.
- **Деньги:** в БД — `Decimal`; на сервере конвертируются в `number` через `toMoneyNumber()` (`lib/money.ts`) для арифметики. Prisma Decimal приходит как объект — извлекай через `.toString()`.
- Структура модуля: `*.module.ts` / `*.controller.ts` / `*.service.ts` / `dto/*.ts`, тесты `*.spec.ts` рядом.

## Клиент: Feature-Sliced Design

Слои (импорт строго сверху вниз): `app` → `pages` → `widgets` → `features` → `entities` → `shared`.

- Алиас `@` → `apps/client/src` (vite + tsconfig).
- Данные — TanStack Query; ключи кэша вынесены в `entities/*/api/*QueryKeys.ts`.
- HTTP — тонкий `shared/api/client.ts` (`apiGet/apiPost/apiPatch/apiDelete`, бросает `ApiError`).
- В dev Vite проксирует `/api` → `http://localhost:3000` (с обрезкой `/api`). В prod базовый URL — `VITE_API_URL`.
- Маршруты: `/income`, `/allocation`, `/expenses`, `/planning`, `/categories` (по умолчанию `/planning`).
- UI — Radix/shadcn в `shared/ui`, Tailwind CSS 4.

## Релизы

`standard-version` в корне, Conventional Commits (`feat:`, `fix:`, `feat!:`). Релиз: `pnpm release` → `git push --follow-tags origin main`. Релизный коммит — `release: 🚀vX.Y.Z` (`.versionrc.json`).
