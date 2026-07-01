import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import {
  carouselTabsContentClassName,
  carouselTabsItemClassName,
  carouselTabsOptions,
  carouselTabsRootClassName,
  carouselTabsViewportClassName,
} from '@/shared/lib/carouselTabsLayout'
import { cn } from '@/shared/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  PageContentLoader,
  SegmentedSwitcher,
  Spinner,
} from '@/shared/ui'
import { MonthLiquidityFlow, PlanningMobileLiquidityHeader } from '@/widgets/liquidity-flow-preview'
import { PlanningMonthMetrics } from '@/widgets/planning-month-metrics'
import { PlanningOutcomeForecast } from '@/widgets/planning-outcome-forecast'

import { planningPageTabPanelScrollClassName } from '../lib/planningPageLayout'
import { PLANNING_TABS } from '../lib/planningTabs'
import type { usePlanningPage } from '../model/usePlanningPage'

import { PlanningEnvelopeForecastSection } from './PlanningEnvelopeForecastSection'
import { PlanningPagePlansSection } from './PlanningPagePlansSection'

type PlanningPageMonthViewsProps = {
  page: ReturnType<typeof usePlanningPage>
  onEditPlanned: (item: PlannedExpense) => void
  onFinishPlanned: (item: PlannedExpense) => void
}

function PlanningSectionFallback({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-24 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60',
        className,
      )}
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

  const plansPanel = (
    <div className="flex min-h-0 flex-col gap-4 md:gap-6">
      {page.isBudgetLoading ? (
        <PlanningSectionFallback
          label="Загрузка метрик"
          className="hidden md:flex"
        />
      ) : (
        <PlanningMonthMetrics
          className="hidden md:grid"
          projection={page.projection}
          savingsTotal={page.savingsTotal}
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
    </div>
  )

  const forecastPanel = page.isForecastLoading ? (
    <PlanningSectionFallback label="Загрузка прогноза по месяцам" />
  ) : (
    <PlanningOutcomeForecast
      outcome={page.outcome}
      onHorizonChange={page.setOutcomeHorizon}
    />
  )

  const overviewPanel = (
    <div className="flex min-h-0 flex-col gap-4 md:gap-6">
      {page.isBudgetLoading ? (
        <PlanningSectionFallback
          label="Загрузка ликвидности"
          className="hidden md:flex"
        />
      ) : (
        <MonthLiquidityFlow className="hidden md:flex" {...liquidityFlowProps} />
      )}

      {page.isForecastLoading ? (
        <PlanningSectionFallback label="Загрузка прогноза конвертов" />
      ) : (
        <PlanningEnvelopeForecastSection forecast={page.envelopeForecast} />
      )}
    </div>
  )

  const panels = [plansPanel, forecastPanel, overviewPanel]

  return (
    <div className={carouselTabsRootClassName}>
      <div className="pb-2 md:pb-3">
        <SegmentedSwitcher
          items={PLANNING_TABS}
          activeId={page.activeTabId}
          onSelect={(id) =>
            page.selectTabSlide(PLANNING_TABS.findIndex((tab) => tab.id === id))
          }
          ariaLabel="Разделы планирования"
        />
      </div>

      <Carousel
        className={carouselTabsViewportClassName}
        opts={carouselTabsOptions}
        setApi={page.setTabsCarouselApi}
      >
        <CarouselContent className={carouselTabsContentClassName}>
          {panels.map((panel, index) => (
            <CarouselItem
              key={PLANNING_TABS[index].id}
              className={carouselTabsItemClassName}
            >
              <div className={planningPageTabPanelScrollClassName}>{panel}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
