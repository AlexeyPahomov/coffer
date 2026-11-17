import type { PlannedEvent } from '@/entities/planned-event/model/types'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { PeriodLedgerSummaryError } from '@/entities/period-ledger-summary'
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
  SectionLoader,
  SegmentedSwitcher,
} from '@/shared/ui'
import { PlanningMobileLiquidityHeader } from '@/widgets/liquidity-flow-preview'
import { PlanningMonthMetrics } from '@/widgets/planning-month-metrics'
import {
  OutcomeHorizonSelector,
  PlanningOutcomeForecast,
} from '@/widgets/planning-outcome-forecast'
import { PlanningSummary } from '@/widgets/planning-summary'

import { planningPageTabPanelScrollClassName } from '../lib/planningPageLayout'
import { PLANNING_TABS } from '../lib/planningTabs'
import type { usePlanningPage } from '../model/usePlanningPage'

import { PlanningPagePlansSection } from './PlanningPagePlansSection'

type PlanningPageMonthViewsProps = {
  page: ReturnType<typeof usePlanningPage>
  onEditPlanned: (item: PlannedExpense) => void
  onFinishPlanned: (item: PlannedExpense) => void
  onEditEvent: (event: PlannedEvent) => void
}

export function PlanningPageMonthMobileHeader({
  page,
}: Pick<PlanningPageMonthViewsProps, 'page'>) {
  if (page.isBudgetLoading || page.isBudgetError) {
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

export function PlanningPageTabsSwitcher({
  page,
}: Pick<PlanningPageMonthViewsProps, 'page'>) {
  return (
    <SegmentedSwitcher
      items={PLANNING_TABS}
      activeId={page.activeTabId}
      onSelect={(id) =>
        page.selectTabSlide(PLANNING_TABS.findIndex((tab) => tab.id === id))
      }
      ariaLabel="Разделы планирования"
    />
  )
}

export function PlanningPageMonthBody({
  page,
  onEditPlanned,
  onFinishPlanned,
  onEditEvent,
}: PlanningPageMonthViewsProps) {
  const plansPanel = (
    <div className="flex min-h-0 flex-col gap-4 md:gap-6">
      {page.isBudgetLoading ? (
        <SectionLoader
          label="Загрузка метрик"
          className="hidden md:flex"
        />
      ) : page.isBudgetError ? (
        <PeriodLedgerSummaryError
          className="hidden md:block"
          message={page.budgetErrorMessage}
        />
      ) : (
        <PlanningMonthMetrics
          className="hidden md:grid"
          projection={page.projection}
          envelopeCommitments={page.envelopeCommitments}
          savingsTotal={page.savingsTotal}
          isSavingsForecast={page.isFuturePeriod}
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
    <SectionLoader label="Загрузка прогноза по месяцам" />
  ) : page.isBudgetError ? (
    <PeriodLedgerSummaryError message={page.budgetErrorMessage} />
  ) : (
    <PlanningOutcomeForecast
      outcome={page.outcome}
      onHorizonChange={page.setOutcomeHorizon}
    />
  )

  const summaryPanel = page.isForecastLoading ? (
    <SectionLoader label="Загрузка сводки планов" />
  ) : page.isBudgetError ? (
    <PeriodLedgerSummaryError message={page.budgetErrorMessage} />
  ) : (
    <PlanningSummary
      summary={page.summary}
      events={page.events}
      horizonControl={
        <OutcomeHorizonSelector
          value={page.summaryHorizon}
          onChange={page.setSummaryHorizon}
        />
      }
      onEditEvent={onEditEvent}
      onDeleteEvent={page.deleteEvent}
      pendingDeleteEventId={page.pendingDeleteEventId}
    />
  )

  const panels = [plansPanel, forecastPanel, summaryPanel]

  return (
    <div className={cn(carouselTabsRootClassName, 'md:grid-rows-[minmax(0,1fr)]')}>
      {/* На десктопе вкладки живут в тулбаре рядом с месяцами. */}
      <div className="pb-2 md:hidden">
        <PlanningPageTabsSwitcher page={page} />
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
