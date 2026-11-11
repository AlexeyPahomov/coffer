import { useState } from 'react'

import { CalendarIcon } from 'lucide-react'

import { formatPlanningPeriodLabel } from '@/entities/budget/lib/periodLabels'
import { formatPlannedExpenseCount } from '@/entities/planned-expense/lib/formatPlannedExpenseCount'
import { currentMonthInputValue } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'
import { buildPeriodMonthSelectOptions } from '@/shared/ui/month-picker/lib/monthSelectOptions'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select/SelectPrimitives'

const PAST_MONTHS = 1
const FUTURE_MONTHS = 10

export type PlanningMonthSelectProps = {
  periodMonth: string
  itemCounts?: Record<string, number>
  itemSwatches?: Record<string, string[]>
  onSelect: (periodMonth: string) => void
}

/** Выпадающий выбор месяца (десктоп) с цветными метками планов у каждого месяца. */
export function PlanningMonthSelect({
  periodMonth,
  itemCounts = {},
  itemSwatches = {},
  onSelect,
}: PlanningMonthSelectProps) {
  const [open, setOpen] = useState(false)
  const currentMonth = currentMonthInputValue()

  // Опции симметричны вокруг текущего месяца — лишнее прошлое отрезаем.
  const months = buildPeriodMonthSelectOptions(currentMonth, FUTURE_MONTHS)
    .map((option) => option.value)
    .slice(FUTURE_MONTHS - PAST_MONTHS)
  // Месяц вне окна (выбран в мобильной ленте) — иначе кнопка окажется пустой.
  if (!months.includes(periodMonth)) {
    months.push(periodMonth)
    months.sort()
  }

  return (
    <SelectRoot
      value={periodMonth}
      onValueChange={onSelect}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        showIcon={false}
        aria-label="Месяц"
        className="min-w-36 justify-start gap-2 rounded-xl data-[size=default]:h-9 border-zinc-200 bg-white px-3 font-medium text-zinc-900 hover:bg-zinc-50 data-[state=open]:bg-zinc-100"
      >
        <CalendarIcon className="size-4 text-zinc-500" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="end"
        hideScrollButtons
        centerSelectedValue={open ? periodMonth : undefined}
        className="max-h-[320px]"
        viewportClassName="max-h-[320px]"
      >
        {months.map((month) => {
          const planCount = itemCounts[month] ?? 0
          const swatches = itemSwatches[month] ?? []

          return (
            <SelectItem
              key={month}
              value={month}
              className={cn('min-h-9 py-0', month < currentMonth && 'text-zinc-400')}
            >
              <span className="flex items-center gap-2">
                {formatPlanningPeriodLabel(month)}
                {planCount > 0 ? (
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {swatches.map((swatchClassName, index) => (
                      <span
                        key={`month-select-swatch-${index}`}
                        className={cn(
                          'inline-block size-1.5 rounded-full',
                          swatchClassName,
                        )}
                      />
                    ))}
                  </span>
                ) : null}
                {planCount > 0 ? (
                  <span className="sr-only">
                    {formatPlannedExpenseCount(planCount)}
                  </span>
                ) : null}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </SelectRoot>
  )
}
