import { useState } from 'react'

import type { Category } from '@/entities/category/model/types'
import { CreatePlannedExpenseDialog } from '@/features/create-planned-expense/ui/CreatePlannedExpenseDialog'
import { cn } from '@/shared/lib/utils'
import { AddButton, Fab } from '@/shared/ui'
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
  onSelectMonth: (periodMonth: string) => void
  /** Мобильный FAB «Новый план» — только на вкладке «Планы». */
  showAddFab?: boolean
}

export function PlanningPageToolbar({
  periodMonth,
  periodLabels,
  itemCounts,
  itemSwatches,
  categories,
  onSelectMonth,
  showAddFab = true,
}: PlanningPageToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <div className={planningPageToolbarClassName}>
        <div className={planningPageToolbarRowClassName}>
          <PlanningMonthTimeline
            periodMonth={periodMonth}
            periodLabels={periodLabels}
            itemCounts={itemCounts}
            itemSwatches={itemSwatches}
            onSelect={onSelectMonth}
          />

          <AddButton
            className={planningPageAddButtonDesktopClassName}
            onClick={() => setCreateOpen(true)}
          >
            Новый план
          </AddButton>
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
      />
    </>
  )
}
