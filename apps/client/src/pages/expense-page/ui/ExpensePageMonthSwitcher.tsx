import { useMemo } from 'react'

import { buildCarouselPeriodLabels } from '@/widgets/planning-month-timeline/lib/buildCarouselPeriodLabels'
import { PlanningMonthSelect } from '@/widgets/planning-month-timeline/ui/PlanningMonthSelect'
import { PlanningMonthTimeline } from '@/widgets/planning-month-timeline/ui/PlanningMonthTimeline'

type ExpensePageMonthSwitcherProps = {
  periodMonth: string
  onPeriodMonthChange: (periodMonth: string) => void
}

export function ExpensePageMonthSwitcher({
  periodMonth,
  onPeriodMonthChange,
}: ExpensePageMonthSwitcherProps) {
  const periodLabels = useMemo(
    () => buildCarouselPeriodLabels(periodMonth),
    [periodMonth],
  )

  return (
    <>
      <div className="hidden shrink-0 md:block">
        <PlanningMonthSelect
          periodMonth={periodMonth}
          onSelect={onPeriodMonthChange}
          pastMonths={12}
        />
      </div>
      <div className="min-w-0 w-full md:hidden">
        <PlanningMonthTimeline
          periodMonth={periodMonth}
          periodLabels={periodLabels}
          onSelect={onPeriodMonthChange}
          showMeta={false}
        />
      </div>
    </>
  )
}
