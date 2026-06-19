import type { ReactNode } from 'react'

import { getExpensePageWorkPanelDomProps } from '../lib/expensePageCategoryFilterTarget'
import {
  type ExpensePageWorkPanelSlide,
  expensePageTabListShellClassName,
  expensePageTabListShellWithTopInsetClassName,
  getExpensePagePanelClassName,
} from '../lib/expensePageLayout'

type ExpensePageTabPanelProps = {
  slide: ExpensePageWorkPanelSlide
  inTab: boolean
  /** Компенсирует gap-3 шапки ItemsList, если заголовок скрыт. */
  topInset?: boolean
  children: ReactNode
}

export function ExpensePageTabPanel({
  slide,
  inTab,
  topInset = false,
  children,
}: ExpensePageTabPanelProps) {
  const content =
    inTab && topInset ? (
      <div className={expensePageTabListShellWithTopInsetClassName}>
        {children}
      </div>
    ) : inTab ? (
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
