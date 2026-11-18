import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import type { PlanningSummary } from '../lib/buildPlanningSummary'
import { formatCompactAmount } from '../lib/planningSummaryFormat'

/** Минимальная высота области столбиков; в растянутой карточке она растёт. */
const BAR_AREA_MIN_HEIGHT_PX = 96

const growTransitionClassName =
  'transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none'

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
    <div
      className="-mx-1 flex flex-1 flex-col overflow-x-auto"
      data-carousel-no-swipe
    >
      <div className="flex min-w-max flex-1 gap-0.5 px-1 pb-2.5 md:min-w-0">
        {summary.months.map((month) => {
          const isLowest = month.month === lowest
          const withdraws = month.sources.savings > 0
          const value = Math.max(0, month.savingsBalance)
          return (
            <div
              key={month.month}
              className="flex min-w-11 flex-1 flex-col items-center gap-1"
              title={`${month.label}: ${formatMoneyWithRub(month.savingsBalance)}`}
            >
              {/*
                Высота столбика — доля flex-grow против «пустоты» над ним:
                растягивается вместе с карточкой без явной высоты контейнера.
                pt резервирует место под подпись над самым высоким столбиком.
              */}
              <div
                className="flex w-full flex-1 flex-col items-center pt-[18px]"
                style={{ minHeight: BAR_AREA_MIN_HEIGHT_PX }}
              >
                <div
                  className={cn('basis-0', growTransitionClassName)}
                  style={{ flexGrow: max - value }}
                />
                <div
                  className={cn(
                    'relative w-full max-w-6 basis-0 rounded-t-md',
                    growTransitionClassName,
                    isLowest
                      ? 'bg-amber-500'
                      : withdraws
                        ? 'bg-emerald-500'
                        : 'bg-emerald-500/40',
                  )}
                  style={{ flexGrow: value }}
                >
                  {withdraws || isLowest ? (
                    <span
                      className={cn(
                        'absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[11px] whitespace-nowrap tabular-nums',
                        isLowest ? 'font-semibold text-amber-700' : 'text-zinc-500',
                      )}
                    >
                      {formatCompactAmount(month.savingsBalance)}
                    </span>
                  ) : null}
                </div>
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
