import type {
  MonthBudgetProjection,
  PlannedExpenseCommitments,
} from '@/processes/forecasting'
import { cn } from '@/shared/lib/utils'

import { PLANNING_METRIC_COPY } from '@/entities/budget'
import { planningMonthMetricsGridClassName } from '../lib/planningMonthMetricsLayout'

import { PlanningMetricCard } from './PlanningMetricCard'

export type PlanningMonthMetricsProps = {
  projection: MonthBudgetProjection
  /** Планы конвертов месяца: в «Остаток» не входят, в карточках показываются отдельной строкой. */
  envelopeCommitments: PlannedExpenseCommitments
  savingsTotal: number
  /** Будущий месяц: накопления — прогноз на конец месяца, а не текущий факт. */
  isSavingsForecast?: boolean
  className?: string
}

export function PlanningMonthMetrics({
  projection,
  envelopeCommitments,
  savingsTotal,
  isSavingsForecast = false,
  className,
}: PlanningMonthMetricsProps) {
  const copy = PLANNING_METRIC_COPY
  const savingsCopy = isSavingsForecast ? copy.savingsForecast : copy.savings

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
        accent="pool"
        title={copy.pool.title}
        caption={copy.pool.caption}
        infoText={copy.pool.infoText}
        value={projection.available}
      />
      <PlanningMetricCard
        accent="reserved"
        title={copy.reserved.title}
        caption={copy.reserved.caption(
          projection.reservedTotal,
          envelopeCommitments.reserved,
        )}
        infoText={copy.reserved.infoText}
        value={projection.reservedTotal + envelopeCommitments.reserved}
      />
      <PlanningMetricCard
        accent="planned"
        title={copy.planned.title}
        caption={copy.planned.caption(
          projection.plannedTotal,
          envelopeCommitments.planned,
        )}
        infoText={copy.planned.infoText}
        value={projection.plannedTotal + envelopeCommitments.planned}
      />
      <PlanningMetricCard
        accent="savings"
        title={savingsCopy.title}
        caption={savingsCopy.caption}
        infoText={savingsCopy.infoText}
        infoBottomOnMax240
        value={savingsTotal}
      />
    </div>
  )
}
