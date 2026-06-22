import type { ReactNode } from 'react'

import { getExpensePageWorkPanelDomProps } from '../lib/expensePageCategoryFilterTarget'
import {
  type ExpensePageWorkPanelSlide,
  expensePageTabListShellClassName,
  getExpensePagePanelClassName,
} from '../lib/expensePageLayout'

type ExpensePageTabPanelProps = {
  slide: ExpensePageWorkPanelSlide
  inTab: boolean
  children: ReactNode
}

export function ExpensePageTabPanel({
  slide,
  inTab,
  children,
}: ExpensePageTabPanelProps) {
  const content = inTab ? (
    <div className={expensePageTabListShellClassName}>{children}</div>
  ) : (
    children
  )

  return (
    <div
      className={getExpensePagePanelClassName(inTab)}
      {...getExpensePageWorkPanelDomProps(slide)}
    >
      {content}
    </div>
  )
}
