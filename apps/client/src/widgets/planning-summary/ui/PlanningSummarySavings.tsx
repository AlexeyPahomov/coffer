import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import type { PlanningSummary } from '../lib/buildPlanningSummary'
import { formatCompactAmount } from '../lib/planningSummaryFormat'

const BAR_AREA_HEIGHT_PX = 96

export function PlanningSummarySavings({
  summary,
}: {
  summary: PlanningSummary
}) {
  const max = Math.max(
    ...summary.months.map((month) => Math.max(0, month.savingsBalance)),
  )
  const lowest = summary.lowestSavingsMonth?.month

  return (
    <div className="-mx-1 overflow-x-auto">
      <div className="flex min-w-max gap-0.5 px-1 md:min-w-0">
        {summary.months.map((month) => {
          const isLowest = month.month === lowest
          const withdraws = month.sources.savings > 0
          return (
            <div
              key={month.month}
              className="flex min-w-11 flex-1 flex-col items-center gap-1"
              title={`${month.label}: ${formatMoneyWithRub(month.savingsBalance)}`}
            >
              <div
                className="flex w-full flex-col items-center justify-end"
                style={{ height: BAR_AREA_HEIGHT_PX }}
              >
                {withdraws || isLowest ? (
                  <span
                    className={cn(
                      'mb-1 text-[11px] tabular-nums',
                      isLowest ? 'font-semibold text-amber-700' : 'text-zinc-500',
                    )}
                  >
                    {formatCompactAmount(month.savingsBalance)}
                  </span>
                ) : null}
                <div
                  className={cn(
                    'w-full max-w-6 rounded-t-md',
                    isLowest
                      ? 'bg-amber-500'
                      : withdraws
                        ? 'bg-emerald-500'
                        : 'bg-emerald-500/40',
                  )}
                  style={{
                    height:
                      max > 0
                        ? (Math.max(0, month.savingsBalance) / max) *
                          (BAR_AREA_HEIGHT_PX - 18)
                        : 0,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                {month.label.slice(0, 3).toLowerCase()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
