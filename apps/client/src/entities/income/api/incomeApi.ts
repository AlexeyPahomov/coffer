import { resolveIncomeStatus, resolveIncomeType } from '@coffer/shared'
import type {
  CreateIncomePayload,
  Income,
  UpdateIncomePayload,
} from '@/entities/income/model/types'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'

const INCOME_PATH = '/income'

export function normalizeIncomeFromApi(income: Income): Income {
  return {
    ...income,
    income_type: resolveIncomeType(income.income_type),
    status: resolveIncomeStatus(income.status),
  }
}

export async function getIncomes(): Promise<Income[]> {
  const rows = await apiGet<Income[]>(INCOME_PATH)
  return rows.map(normalizeIncomeFromApi)
}

export function createIncome(payload: CreateIncomePayload): Promise<Income> {
  return apiPost<Income>(INCOME_PATH, payload)
}

export function updateIncome(
  id: string,
  payload: UpdateIncomePayload,
): Promise<Income> {
  return apiPatch<Income>(`${INCOME_PATH}/${encodeURIComponent(id)}`, payload)
}

export function receiveIncome(id: string, userId: string): Promise<Income> {
  const q = new URLSearchParams({ user_id: userId })
  return apiPatch<Income>(
    `${INCOME_PATH}/${encodeURIComponent(id)}/receive?${q}`,
    {},
  )
}

export function deleteIncome(id: string, userId: string): Promise<void> {
  const q = new URLSearchParams({ user_id: userId })
  return apiDelete<void>(`${INCOME_PATH}/${encodeURIComponent(id)}?${q}`)
}
