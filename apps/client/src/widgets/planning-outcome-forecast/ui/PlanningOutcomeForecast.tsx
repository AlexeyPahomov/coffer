import { formatAmount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui'

import {
  OUTCOME_HORIZONS,
  type OutcomeHorizon,
  type PlanningOutcome,
} from '../lib/planningOutcomeTypes'

export type PlanningOutcomeForecastProps = {
  outcome: PlanningOutcome
  onHorizonChange: (horizon: OutcomeHorizon) => void
  className?: string
}

function HorizonSelector({
  value,
  onChange,
}: {
  value: OutcomeHorizon
  onChange: (horizon: OutcomeHorizon) => void
}) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as OutcomeHorizon)}
      aria-label="Горизонт прогноза"
    >
      <TabsList>
        {OUTCOME_HORIZONS.map((horizon) => (
          <TabsTrigger
            key={horizon}
            value={String(horizon)}
            className="px-2.5 text-xs tabular-nums"
          >
            {horizon} мес
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function OutcomeTrajectory({
  months,
}: {
  months: PlanningOutcome['months']
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
            <th className="px-3 py-2 text-left font-medium">Месяц</th>
            <th className="px-3 py-2 text-right font-medium">Свободный пул</th>
            <th className="px-3 py-2 text-right font-medium">Накопления</th>
          </tr>
        </thead>
        <tbody>
          {months.map((point) => (
            <tr
              key={point.month}
              className={cn(
                'border-b border-zinc-100 last:border-b-0',
                point.deficit > 0 && 'bg-rose-50/60',
              )}
            >
              <td className="px-3 py-2 text-left text-zinc-600">
                {point.label}
              </td>
              <td
                className={cn(
                  'px-3 py-2 text-right tabular-nums',
                  point.deficit > 0
                    ? 'font-semibold text-rose-600'
                    : 'text-zinc-800',
                )}
              >
                {formatAmount(point.projectedFree)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-800">
                {formatAmount(point.savingsBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PlanningOutcomeForecast({
  outcome,
  onHorizonChange,
  className,
}: PlanningOutcomeForecastProps) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-800">
          Прогноз по месяцам
        </h3>
        <HorizonSelector value={outcome.horizon} onChange={onHorizonChange} />
      </header>

      {outcome.hasDeficit ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          На горизонте прогнозируется дефицит свободного пула — план трат
          превышает ликвидность.
        </p>
      ) : null}

      <OutcomeTrajectory months={outcome.months} />
    </section>
  )
}
