import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { PageContentLoader, Spinner } from '@/shared/ui'
import { MonthLiquidityFlow, PlanningMobileLiquidityHeader } from '@/widgets/liquidity-flow-preview'
import { PlanningMonthMetrics } from '@/widgets/planning-month-metrics'

import type { usePlanningPage } from '../model/usePlanningPage'

import { PlanningEnvelopeForecastSection } from './PlanningEnvelopeForecastSection'
import { PlanningPagePlansSection } from './PlanningPagePlansSection'

type PlanningPageMonthViewsProps = {
  page: ReturnType<typeof usePlanningPage>
  onEditPlanned: (item: PlannedExpense) => void
  onFinishPlanned: (item: PlannedExpense) => void
}

function PlanningSectionFallback({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60"
      aria-busy="true"
    >
      <Spinner className="size-6 text-zinc-400" aria-label={label} />
    </div>
  )
}

export function PlanningPageMonthMobileHeader({
  page,
}: Pick<PlanningPageMonthViewsProps, 'page'>) {
  if (page.isBudgetLoading) {
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
  const liquidityFlowProps = {
    projection: page.projection,
    expectedIncomeTotal: page.expectedIncomeTotal,
  }

  return (
    <>
      {page.isBudgetLoading ? (
        <PlanningSectionFallback label="Загрузка метрик" />
      ) : (
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
        </>
      )}

      {page.isForecastLoading ? (
        <PlanningSectionFallback label="Загрузка прогноза конвертов" />
      ) : (
        <PlanningEnvelopeForecastSection forecast={page.envelopeForecast} />
      )}

      {page.isPlansLoading ? (
        <PageContentLoader className="min-h-40" />
      ) : (
        <PlanningPagePlansSection
          page={page}
          onEditPlanned={onEditPlanned}
          onFinishPlanned={onFinishPlanned}
        />
      )}
    </>
  )
}
