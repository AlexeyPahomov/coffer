import {
  DEFAULT_ALLOCATION_TYPE,
  DEFAULT_CATEGORY_ICON_KEY,
  DEFAULT_ICON_COLOR_KEY,
  DEFAULT_INCOME_TYPE,
  getMonthKeyFromIso,
} from '@coffer/shared'
import type { CarryOverPolicy, CategoryType, IncomeStatus } from '@coffer/shared'

import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'

/**
 * Общие фикстур-билдеры доменных событий для тестов budget-логики
 * (используются `periodLedgerParity.spec.ts` и `budgetLedgerLib.spec.ts`).
 * Не тест-файл — vitest подхватывает только `*.spec.ts`.
 */

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`

export function category(
  id: string,
  type: CategoryType,
  carryOverPolicy: CarryOverPolicy = 'RESET',
): Category {
  return {
    id,
    user_id: 'u1',
    name: id,
    type,
    icon: DEFAULT_CATEGORY_ICON_KEY,
    icon_color: DEFAULT_ICON_COLOR_KEY,
    carry_over_policy: carryOverPolicy,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

export function income(
  amount: number,
  month: string,
  status: IncomeStatus = 'RECEIVED',
): Income {
  return {
    id: nextId('inc'),
    user_id: 'u1',
    amount: String(amount),
    source: null,
    income_type: DEFAULT_INCOME_TYPE,
    status,
    period_month: `${month}-01T00:00:00.000Z`,
    received_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

export function allocation(
  cat: Category,
  inc: Income,
  amount: number,
): Allocation {
  const month = getMonthKeyFromIso(inc.period_month) ?? '2026-01'
  return {
    id: nextId('alloc'),
    user_id: 'u1',
    income_id: inc.id,
    category_id: cat.id,
    amount: String(amount),
    type: DEFAULT_ALLOCATION_TYPE,
    period_month: `${month}-01T00:00:00.000Z`,
    created_at: '2026-01-01T00:00:00.000Z',
    category: cat,
    income: inc,
  }
}

export function expense(cat: Category, amount: number, date: string): Expense {
  return {
    id: nextId('exp'),
    user_id: 'u1',
    category_id: cat.id,
    amount,
    description: null,
    date: `${date}T00:00:00.000Z`,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}
