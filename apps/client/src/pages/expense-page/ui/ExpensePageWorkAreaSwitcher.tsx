import { AddButton, SegmentedSwitcher } from '@/shared/ui'

import { EXPENSE_ADD_LABEL } from '../lib/expensePageCopy'

import {
  expensePageWorkAddButtonClassName,
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
      <SegmentedSwitcher
        items={EXPENSE_PAGE_WORK_SLIDES}
        activeId={activeSlideId}
        onSelect={onSelect}
        ariaLabel="Разделы расходов"
      />

      <AddButton
        className={expensePageWorkAddButtonClassName}
        onClick={onAddExpense}
      >
        {EXPENSE_ADD_LABEL}
      </AddButton>
    </div>
  )
}
