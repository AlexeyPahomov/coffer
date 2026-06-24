import type { QueryClient } from '@tanstack/react-query'

import { allocationRuleKeys } from '@/entities/allocation-rule/api/allocationRuleQueryKeys'
import { budgetCycleQueryKeys } from '@/entities/budget-cycle/api/budgetCycleQueryKeys'
import { budgetMonthQueryKeys } from '@/entities/budget-month/api/budgetMonthQueryKeys'
import { categoryKeys } from '@/entities/category/api/categoryQueryKeys'
import { incomeKeys } from '@/entities/income/api/incomeQueryKeys'
import { periodLedgerSummaryQueryKeys } from '@/entities/period-ledger-summary/api/periodLedgerSummaryQueryKeys'
import { plannedExpenseQueryKeys } from '@/entities/planned-expense/api/plannedExpenseQueryKeys'

import type { AppBootstrap } from '../model/types'

export type BootstrapCacheMeta = {
  periodMonth: string
  asOf: string
}

/** Раскладывает bootstrap в существующие ключи React Query. */
export function seedQueryCacheFromBootstrap(
  queryClient: QueryClient,
  bootstrap: AppBootstrap,
  meta: BootstrapCacheMeta,
): void {
  queryClient.setQueryData(categoryKeys.lists(), bootstrap.categories)
  queryClient.setQueryData(incomeKeys.lists(), bootstrap.incomes)
  queryClient.setQueryData(plannedExpenseQueryKeys.all, bootstrap.plannedExpenses)
  queryClient.setQueryData(allocationRuleKeys.lists(), bootstrap.allocationRules)
  queryClient.setQueryData(
    budgetMonthQueryKeys.byPeriod(meta.periodMonth),
    bootstrap.budgetMonth,
  )
  queryClient.setQueryData(
    periodLedgerSummaryQueryKeys.byPeriod(meta.periodMonth),
    bootstrap.periodLedgerSummary,
  )

  if (bootstrap.budgetCycle) {
    queryClient.setQueryData(
      budgetCycleQueryKeys.current(meta.asOf),
      bootstrap.budgetCycle,
    )
    return
  }

  queryClient.removeQueries({
    queryKey: budgetCycleQueryKeys.current(meta.asOf),
  })
}
