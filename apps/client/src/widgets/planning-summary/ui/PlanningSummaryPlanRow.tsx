import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { PlannedExpenseIconAvatar } from '@/entities/planned-expense/ui/PlannedExpenseIconAvatar'
import { formatDateRangeLabelWithoutYear } from '@/shared/lib/date'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import type { PlanFundingSources } from '../lib/buildPlanningSummary'
import {
  FUNDING_SOURCES,
  formatCompactAmount,
} from '../lib/planningSummaryFormat'

type PlanningSummaryPlanRowProps = {
  plan: PlannedExpense
  sources: PlanFundingSources
  isBig: boolean
  /** Подпись события, если план к нему привязан. */
  eventTitle?: string
}

export function PlanningSummaryPlanRow({
  plan,
  sources,
  isBig,
  eventTitle,
}: PlanningSummaryPlanRowProps) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-1.5">
      <PlannedExpenseIconAvatar
        iconName={plan.icon_name}
        iconColor={plan.icon_color}
        className="size-9"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">
          {plan.title}
          {isBig ? (
            <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-px align-middle text-[11px] font-semibold text-violet-700">
              крупная
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {formatDateRangeLabelWithoutYear(plan.planned_date, plan.planned_date_end)}
          {eventTitle ? ` · ${eventTitle}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-zinc-900 tabular-nums">
          {formatMoneyWithRub(plan.amount)}
        </p>
        <p className="mt-0.5 flex justify-end gap-2 text-[11px] text-zinc-500 tabular-nums">
          {FUNDING_SOURCES.filter(({ key }) => sources[key] > 0).map(
            ({ key, label, className }) => (
              <span key={key} className="flex items-center gap-1" title={label}>
                <span className={cn('size-1.5 rounded-full', className)} aria-hidden />
                {formatCompactAmount(sources[key])}
              </span>
            ),
          )}
        </p>
      </div>
    </li>
  )
}
