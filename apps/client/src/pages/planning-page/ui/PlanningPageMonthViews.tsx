import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { Spinner } from '@/shared/ui'
import { MonthLiquidityFlow, PlanningMobileLiquidityHeader } from '@/widgets/liquidity-flow-preview'
import { PlanningMonthMetrics } from '@/widgets/planning-month-metrics'

import type { usePlanningPage } from '../model/usePlanningPage'

import { PlanningPagePlansSection } from './PlanningPagePlansSection'

type PlanningPageMonthViewsProps = {
  page: ReturnType<typeof usePlanningPage>
  onEditPlanned: (item: PlannedExpense) => void
  onFinishPlanned: (item: PlannedExpense) => void
}

export function PlanningPageMonthMobileHeader({
  page,
}: Pick<PlanningPageMonthViewsProps, 'page'>) {
  if (page.isLoading) {
    return null
  }

  const liquidityFlowProps = {
    projection: page.projection,
    expectedIncomeTotal: page.expectedIncomeTotal,
  }

  return (
    <PlanningMobileLiquidityHeader {...liquidityFlowProps} />
  )
}

export function PlanningPageMonthBody({
  page,
  onEditPlanned,
  onFinishPlanned,
}: PlanningPageMonthViewsProps) {
  if (page.isLoading) {
    return (
      <div
        className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center"
        aria-busy="true"
      >
        <Spinner className="size-8 text-zinc-500" aria-label="Загрузка" />
      </div>
    )
  }

  const liquidityFlowProps = {
    projection: page.projection,
    expectedIncomeTotal: page.expectedIncomeTotal,
  }

  return (
    <>
      <PlanningMonthMetrics
        className="hidden md:grid"
        projection={page.projection}
        periodMonth={page.periodMonth}
        expectedIncomeTotal={page.expectedIncomeTotal}
      />

      <MonthLiquidityFlow
        className="hidden md:flex"
        {...liquidityFlowProps}
      />

      <PlanningPagePlansSection
        page={page}
        onEditPlanned={onEditPlanned}
        onFinishPlanned={onFinishPlanned}
      />
    </>
  )
}
