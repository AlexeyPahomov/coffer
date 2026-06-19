import { cn } from '@/shared/lib/utils'
import { AddButton, Button } from '@/shared/ui'

import { EXPENSE_ADD_LABEL } from '../lib/expensePageCopy'

import {
  expensePageWorkAddButtonClassName,
  expensePageWorkSwitcherButtonActiveClassName,
  expensePageWorkSwitcherButtonClassName,
  expensePageWorkSwitcherClassName,
  expensePageWorkSwitcherBarClassName,
} from '../lib/expensePageWorkCarouselLayout'
import { getExpensePageWorkSwitcherDomProps } from '../lib/expensePageCategoryFilterTarget'
import {
  EXPENSE_PAGE_WORK_SLIDES,
  type ExpensePageWorkSlideId,
} from '../lib/expensePageWorkAreaSlides'

type ExpensePageWorkAreaSwitcherProps = {
  activeSlideId: ExpensePageWorkSlideId
  onSelect: (slideId: ExpensePageWorkSlideId) => void
  onAddExpense: () => void
}

export function ExpensePageWorkAreaSwitcher({
  activeSlideId,
  onSelect,
  onAddExpense,
}: ExpensePageWorkAreaSwitcherProps) {
  return (
    <div
      className={expensePageWorkSwitcherBarClassName}
      {...getExpensePageWorkSwitcherDomProps()}
    >
      <div
        className={expensePageWorkSwitcherClassName}
        role="tablist"
        aria-label="Разделы расходов"
      >
        {EXPENSE_PAGE_WORK_SLIDES.map((slide) => {
          const isActive = slide.id === activeSlideId

          return (
            <Button
              key={slide.id}
              type="button"
              role="tab"
              variant="ghost"
              size="sm"
              aria-selected={isActive}
              className={cn(
                expensePageWorkSwitcherButtonClassName,
                !isActive &&
                  'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900',
                isActive && expensePageWorkSwitcherButtonActiveClassName,
              )}
              onClick={() => onSelect(slide.id)}
            >
              {slide.label}
            </Button>
          )
        })}
      </div>

      <AddButton
        className={expensePageWorkAddButtonClassName}
        onClick={onAddExpense}
      >
        {EXPENSE_ADD_LABEL}
      </AddButton>
    </div>
  )
}
