import type { MonthBudgetProjection } from '@/processes/forecasting'
import { cn } from '@/shared/lib/utils'

import {
  PLANNING_METRIC_COPY,
  planningForecastMetricTitle,
} from '@/entities/budget'
import { planningMonthMetricsGridClassName } from '../lib/planningMonthMetricsLayout'

import { PlanningMetricCard } from './PlanningMetricCard'

export type PlanningMonthMetricsProps = {
  projection: MonthBudgetProjection
  periodMonth: string
  expectedIncomeTotal: number
  className?: string
}

export function PlanningMonthMetrics({
  projection,
  periodMonth,
  expectedIncomeTotal,
  className,
}: PlanningMonthMetricsProps) {
  const copy = PLANNING_METRIC_COPY

  return (
    <div className={cn(planningMonthMetricsGridClassName, className)}>
      <PlanningMetricCard
        accent="forecast"
        title={planningForecastMetricTitle(periodMonth)}
        caption={copy.forecast.caption}
        infoText={copy.forecast.infoText}
        value={projection.projectedFree}
      />
      <PlanningMetricCard
        accent="pool"
        title={copy.pool.title}
        caption={copy.pool.caption}
        infoText={copy.pool.infoText}
        value={projection.available}
      />
      <PlanningMetricCard
        accent="income"
        title={copy.income.title}
        caption={copy.income.caption}
        infoText={copy.income.infoText}
        value={expectedIncomeTotal}
      />
      <PlanningMetricCard
        accent="planned"
        title={copy.planned.title}
        caption={copy.planned.caption}
        infoText={copy.planned.infoText}
        value={projection.plannedTotal}
      />
      <PlanningMetricCard
        accent="reserved"
        title={copy.reserved.title}
        caption={copy.reserved.caption}
        infoText={copy.reserved.infoText}
        infoBottomOnMax240
        value={projection.reservedTotal}
      />
    </div>
  )
}
