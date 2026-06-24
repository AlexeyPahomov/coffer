import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'
import { DEV_USER_ID } from '@/shared/lib/constants'
import { toMoneyNumber } from '@/shared/lib/money'

import type {
  CreateExpensePayload,
  Expense,
  UpdateExpensePayload,
} from '../model/types'

const EXPENSE_PATH = '/expense'

/** Ответ API до приведения к frontend contract. */
export type ExpenseApiRow = {
  id: string
  user_id: string
  category_id: string
  amount: string | number
  description: string | null
  date: string
  created_at: string
}

export function mapExpenseFromApiRow(row: ExpenseApiRow): Expense {
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    amount: toMoneyNumber(row.amount),
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  }
}

export function getExpenses(): Promise<Expense[]> {
  return apiGet<ExpenseApiRow[]>(EXPENSE_PATH).then((rows) =>
    rows.map(mapExpenseFromApiRow),
  )
}

export type ExpenseHistoryPage = {
  items: Expense[]
  nextCursor: string | null
}

type ExpenseHistoryPageApiResponse = {
  items: ExpenseApiRow[]
  nextCursor: string | null
}

export function getExpenseHistoryPage(options: {
  periodMonth: string
  categoryId?: string
  cursor?: string
  limit?: number
}): Promise<ExpenseHistoryPage> {
  const q = new URLSearchParams({
    user_id: DEV_USER_ID,
    period_month: options.periodMonth,
  })
  if (options.categoryId) {
    q.set('category_id', options.categoryId)
  }
  if (options.cursor) {
    q.set('cursor', options.cursor)
  }
  if (options.limit != null) {
    q.set('limit', String(options.limit))
  }

  return apiGet<ExpenseHistoryPageApiResponse>(`${EXPENSE_PATH}?${q}`).then(
    (page) => ({
      items: page.items.map(mapExpenseFromApiRow),
      nextCursor: page.nextCursor,
    }),
  )
}

export function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return apiPost<ExpenseApiRow>(EXPENSE_PATH, payload).then(mapExpenseFromApiRow)
}

export function updateExpense(
  id: string,
  payload: UpdateExpensePayload,
): Promise<Expense> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiPatch<ExpenseApiRow>(
    `${EXPENSE_PATH}/${encodeURIComponent(id)}?${q}`,
    payload,
  ).then(mapExpenseFromApiRow)
}

export function deleteExpense(id: string): Promise<void> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiDelete<void>(`${EXPENSE_PATH}/${encodeURIComponent(id)}?${q}`)
}
