import {
  DEFAULT_PLANNED_EXPENSE_ICON_KEY,
  getMonthKeyFromIso,
  resolveIconColorKey,
} from '@coffer/shared'

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'
import { DEV_USER_ID } from '@/shared/lib/constants'
import { toMoneyNumber } from '@/shared/lib/money'

import type {
  CreatePlannedExpensePayload,
  FinishPlannedExpensePayload,
  PlannedExpense,
  PlannedExpenseStatus,
  UpdatePlannedExpensePayload,
} from '../model/types'

const PLANNED_EXPENSE_PATH = '/planned-expense'

type BudgetMonthApiSlice = {
  year: number
  month: number
}

export type PlannedExpenseApiRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  icon_name?: string
  icon_color?: string
  amount: string | number
  reserved_amount: string | number
  planned_date: string
  planned_date_end?: string | null
  status: PlannedExpenseStatus
  category_id: string | null
  budget_month_id: string
  budgetMonth?: BudgetMonthApiSlice
  completed_expense_id?: string | null
  created_at: string
  updated_at: string
}

function periodMonthFromRow(row: PlannedExpenseApiRow): string {
  if (row.budgetMonth) {
    const { year, month } = row.budgetMonth
    return `${year}-${String(month).padStart(2, '0')}`
  }

  return getMonthKeyFromIso(row.planned_date) ?? ''
}

export function mapPlannedExpenseFromApiRow(
  row: PlannedExpenseApiRow,
): PlannedExpense {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    icon_name: row.icon_name ?? DEFAULT_PLANNED_EXPENSE_ICON_KEY,
    icon_color: resolveIconColorKey(row.icon_color),
    amount: toMoneyNumber(row.amount),
    reserved_amount: toMoneyNumber(row.reserved_amount),
    planned_date: row.planned_date,
    planned_date_end: row.planned_date_end ?? null,
    status: row.status,
    category_id: row.category_id,
    budget_month_id: row.budget_month_id,
    period_month: periodMonthFromRow(row),
    completed_expense_id: row.completed_expense_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function getPlannedExpenses(periodMonth?: string): Promise<PlannedExpense[]> {
  const q = periodMonth
    ? `?${new URLSearchParams({ period: periodMonth })}`
    : ''
  return apiGet<PlannedExpenseApiRow[]>(`${PLANNED_EXPENSE_PATH}${q}`).then(
    (rows) => rows.map(mapPlannedExpenseFromApiRow),
  )
}

export function createPlannedExpense(
  payload: CreatePlannedExpensePayload,
): Promise<PlannedExpense> {
  return apiPost<PlannedExpenseApiRow>(PLANNED_EXPENSE_PATH, payload).then(
    mapPlannedExpenseFromApiRow,
  )
}

export function updatePlannedExpense(
  id: string,
  payload: UpdatePlannedExpensePayload,
): Promise<PlannedExpense> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiPatch<PlannedExpenseApiRow>(
    `${PLANNED_EXPENSE_PATH}/${encodeURIComponent(id)}?${q}`,
    payload,
  ).then(mapPlannedExpenseFromApiRow)
}

export function deletePlannedExpense(id: string): Promise<void> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiDelete<void>(`${PLANNED_EXPENSE_PATH}/${encodeURIComponent(id)}?${q}`)
}

export function finishPlannedExpense(
  id: string,
  payload: FinishPlannedExpensePayload,
): Promise<PlannedExpense> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiPost<{ plannedExpense: PlannedExpenseApiRow }>(
    `${PLANNED_EXPENSE_PATH}/${encodeURIComponent(id)}/finish?${q}`,
    payload,
  ).then((response) => mapPlannedExpenseFromApiRow(response.plannedExpense))
}

export function unfinishPlannedExpense(id: string): Promise<PlannedExpense> {
  const q = new URLSearchParams({ user_id: DEV_USER_ID })
  return apiPost<PlannedExpenseApiRow>(
    `${PLANNED_EXPENSE_PATH}/${encodeURIComponent(id)}/unfinish?${q}`,
    {},
  ).then(mapPlannedExpenseFromApiRow)
}
