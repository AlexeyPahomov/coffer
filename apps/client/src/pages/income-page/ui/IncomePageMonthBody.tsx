import type { Income } from '@/entities/income/model/types'
import type { IncomePageMetrics } from '@/pages/income-page/lib/incomePageAnalytics'
import {
  incomePageDashboardClassName,
  incomePageListScrollClassName,
} from '@/pages/income-page/lib/incomePageLayout'

import { IncomePageIncomeList } from './IncomePageIncomeList'
import { IncomePageMetrics as IncomePageMetricsBlock } from './IncomePageMetrics'

export type IncomePageMonthBodyProps = {
  metrics: IncomePageMetrics
  monthIncomes: Income[]
  isPending: boolean
  isError: boolean
  error: unknown
  onEditIncome: (income: Income) => void
  onReceiveIncome: (income: Income) => void
}

export function IncomePageMonthBody({
  metrics,
  monthIncomes,
  isPending,
  isError,
  error,
  onEditIncome,
  onReceiveIncome,
}: IncomePageMonthBodyProps) {
  return (
    <>
      <div className={incomePageDashboardClassName}>
        <IncomePageMetricsBlock metrics={metrics} />
      </div>

      <div className={incomePageListScrollClassName}>
        <IncomePageIncomeList
          items={monthIncomes}
          isPending={isPending}
          isError={isError}
          error={error}
          onEdit={onEditIncome}
          onReceive={onReceiveIncome}
        />
      </div>
    </>
  )
}
