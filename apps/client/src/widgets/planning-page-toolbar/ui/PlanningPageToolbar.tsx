import { type ReactNode, useState } from 'react'

import type { Category } from '@/entities/category/model/types'
import type { ResolvePlannedExpenseAvailableFunds } from '@/features/create-planned-expense/model/types'
import { CreatePlannedExpenseDialog } from '@/features/create-planned-expense/ui/CreatePlannedExpenseDialog'
import { cn } from '@/shared/lib/utils'
import { AddButton, Fab } from '@/shared/ui'
import { PlanningMonthSelect } from '@/widgets/planning-month-timeline/ui/PlanningMonthSelect'
import { PlanningMonthTimeline } from '@/widgets/planning-month-timeline/ui/PlanningMonthTimeline'

import {
  planningPageAddButtonDesktopClassName,
  planningPageToolbarClassName,
  planningPageToolbarRowClassName,
} from '../lib/planningPageToolbarLayout'

export type PlanningPageToolbarProps = {
  periodMonth: string
  periodLabels: Record<string, string>
  itemCounts: Record<string, number>
  itemSwatches: Record<string, string[]>
  categories: readonly Category[]
  savingsCategories: readonly Category[]
  resolveAvailableFunds: ResolvePlannedExpenseAvailableFunds
  onSelectMonth: (periodMonth: string) => void
  /** Мобильный FAB «Новый план» — только на вкладке «Планы». */
  showAddFab?: boolean
  /** Вкладки слева (десктоп): месяц тогда — выпадающий список справа. */
  tabs?: ReactNode
}

export function PlanningPageToolbar({
  periodMonth,
  periodLabels,
  itemCounts,
  itemSwatches,
  categories,
  savingsCategories,
  resolveAvailableFunds,
  onSelectMonth,
  showAddFab = true,
  tabs,
}: PlanningPageToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false)

  const addButton = (
    <AddButton
      className={planningPageAddButtonDesktopClassName}
      onClick={() => setCreateOpen(true)}
    >
      Новый план
    </AddButton>
  )

  return (
    <>
      <div className={planningPageToolbarClassName}>
        <div className={planningPageToolbarRowClassName}>
          {tabs != null ? (
            <>
              {tabs}
              <div className="flex min-w-0 items-center gap-4">
                <PlanningMonthSelect
                  periodMonth={periodMonth}
                  itemCounts={itemCounts}
                  itemSwatches={itemSwatches}
                  onSelect={onSelectMonth}
                />
                {addButton}
              </div>
            </>
          ) : (
            <>
              <PlanningMonthTimeline
                periodMonth={periodMonth}
                periodLabels={periodLabels}
                itemCounts={itemCounts}
                itemSwatches={itemSwatches}
                onSelect={onSelectMonth}
              />
              {addButton}
            </>
          )}
        </div>
      </div>

      <Fab
        label="Новый план"
        onClick={() => setCreateOpen(true)}
        aria-hidden={!showAddFab}
        tabIndex={showAddFab ? undefined : -1}
        className={cn(
          'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
          showAddFab
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-90 opacity-0',
        )}
      />

      <CreatePlannedExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        anchorPeriodMonth={periodMonth}
        categories={categories}
        savingsCategories={savingsCategories}
        resolveAvailableFunds={resolveAvailableFunds}
      />
    </>
  )
}
