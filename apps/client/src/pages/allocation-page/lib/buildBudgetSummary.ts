import { sumMoneyAmounts } from '@coffer/shared'

import { allocationIncomePercentOrZero } from '@/entities/allocation/model/calculations'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'
import type { Income } from '@/entities/income/model/types'

import { resolveIncomeCardTone, type IncomeCardTone } from './allocationIncomeCard'

export type BudgetSummary = {
  /** Ещё не полученные доходы месяца. */
  expected: number
  /** Сколько доходов месяца ещё не получено. */
  expectedCount: number
  received: number
  /** Доля полученного от всех доходов месяца, %. */
  receivedPercent: number
  allocated: number
  remaining: number
  allocatedPercent: number
  tone: IncomeCardTone
}

/** Воронка месяца: ожидается → получено → распределено → осталось. */
export function buildBudgetSummary(
  monthIncomes: readonly Income[],
  allocated: number,
): BudgetSummary {
  const pending = monthIncomes.filter((income) => !isReceivedIncome(income))
  const expected = sumMoneyAmounts(pending.map((income) => income.amount))
  const received = sumMoneyAmounts(
    monthIncomes.filter(isReceivedIncome).map((income) => income.amount),
  )
  const monthTotal = expected + received
  const allocatedPercent = allocationIncomePercentOrZero(allocated, received)

  const remaining = received - allocated

  return {
    expected,
    expectedCount: pending.length,
    received,
    // Вниз: 100% — только когда получено всё.
    receivedPercent:
      monthTotal > 0 ? Math.floor((received / monthTotal) * 100) : 0,
    allocated,
    remaining,
    allocatedPercent,
    // Распределили больше, чем получили, — это не «всё распределено», а перерасход.
    tone:
      remaining < 0 ? 'over' : resolveIncomeCardTone(allocated, allocatedPercent),
  }
}
