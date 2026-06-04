export const INCOME_STATUSES = ['RECEIVED', 'EXPECTED'] as const

export type IncomeStatus = (typeof INCOME_STATUSES)[number]

export const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  RECEIVED: 'Получен',
  EXPECTED: 'Ожидается',
}

export const DEFAULT_INCOME_STATUS: IncomeStatus = 'RECEIVED'

export function isIncomeStatus(value: string): value is IncomeStatus {
  return (INCOME_STATUSES as readonly string[]).includes(value)
}

export function resolveIncomeStatus(
  value: string | null | undefined,
): IncomeStatus {
  if (value && isIncomeStatus(value)) {
    return value
  }
  return DEFAULT_INCOME_STATUS
}

export function isReceivedIncomeStatus(
  value: string | null | undefined,
): boolean {
  return resolveIncomeStatus(value) === 'RECEIVED'
}
