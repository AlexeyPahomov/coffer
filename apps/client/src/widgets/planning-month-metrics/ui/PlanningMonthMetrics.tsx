import type { MonthBudgetProjection } from '@/processes/forecasting'
import { cn } from '@/shared/lib/utils'

import { PLANNING_METRIC_COPY } from '@/entities/budget'
import { planningMonthMetricsGridClassName } from '../lib/planningMonthMetricsLayout'

import { PlanningMetricCard } from './PlanningMetricCard'

export type PlanningMonthMetricsProps = {
  projection: MonthBudgetProjection
  savingsTotal: number
  className?: string
}

export function PlanningMonthMetrics({
  projection,
  savingsTotal,
  className,
}: PlanningMonthMetricsProps) {
  const copy = PLANNING_METRIC_COPY

  return (
    <div className={cn(planningMonthMetricsGridClassName, className)}>
      <PlanningMetricCard
        accent="forecast"
        title={copy.forecast.title}
        caption={copy.forecast.caption}
        infoText={copy.forecast.infoText}
        value={projection.projectedFree}
      />
      <PlanningMetricCard
        accent="reserved"
        title={copy.reserved.title}
        caption={copy.reserved.caption}
        infoText={copy.reserved.infoText}
        value={projection.reservedTotal}
      />
      <PlanningMetricCard
        accent="planned"
        title={copy.planned.title}
        caption={copy.planned.caption}
        infoText={copy.planned.infoText}
        value={projection.plannedTotal}
      />
      <PlanningMetricCard
        accent="pool"
        title={copy.pool.title}
        caption={copy.pool.caption}
        infoText={copy.pool.infoText}
        value={projection.available}
      />
      <PlanningMetricCard
        accent="savings"
        title={copy.savings.title}
        caption={copy.savings.caption}
        infoText={copy.savings.infoText}
        infoBottomOnMax240
        value={savingsTotal}
      />
    </div>
  )
}
