import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import {
  PageContentLoader,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui'
import { MonthLiquidityFlow, PlanningMobileLiquidityHeader } from '@/widgets/liquidity-flow-preview'
import { PlanningMonthMetrics } from '@/widgets/planning-month-metrics'
import { PlanningOutcomeForecast } from '@/widgets/planning-outcome-forecast'

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
    <Tabs defaultValue="plans" className="min-h-0 flex-1">
      <TabsList className="max-md:w-full">
        <TabsTrigger value="plans">Планы</TabsTrigger>
        <TabsTrigger value="forecast">Прогноз</TabsTrigger>
        <TabsTrigger value="overview">Обзор</TabsTrigger>
      </TabsList>

      <TabsContent
        value="plans"
        className="flex min-h-0 flex-col gap-4 md:gap-6"
      >
        {page.isBudgetLoading ? (
          <PlanningSectionFallback label="Загрузка метрик" />
        ) : (
          <PlanningMonthMetrics
            className="hidden md:grid"
            projection={page.projection}
            periodMonth={page.periodMonth}
            expectedIncomeTotal={page.expectedIncomeTotal}
          />
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
      </TabsContent>

      <TabsContent value="forecast" className="min-h-0">
        {page.isForecastLoading ? (
          <PlanningSectionFallback label="Загрузка прогноза по месяцам" />
        ) : (
          <PlanningOutcomeForecast
            outcome={page.outcome}
            onHorizonChange={page.setOutcomeHorizon}
          />
        )}
      </TabsContent>

      <TabsContent
        value="overview"
        className="flex min-h-0 flex-col gap-4 md:gap-6"
      >
        {page.isBudgetLoading ? (
          <PlanningSectionFallback label="Загрузка ликвидности" />
        ) : (
          <MonthLiquidityFlow
            className="hidden md:flex"
            {...liquidityFlowProps}
          />
        )}

        {page.isForecastLoading ? (
          <PlanningSectionFallback label="Загрузка прогноза конвертов" />
        ) : (
          <PlanningEnvelopeForecastSection forecast={page.envelopeForecast} />
        )}
      </TabsContent>
    </Tabs>
  )
}
