import { useState } from 'react'

import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { EditPlannedExpenseDialog } from '@/features/create-planned-expense/ui/EditPlannedExpenseDialog'
import { FinishPlannedExpenseDialog } from '@/features/finish-planned-expense/ui/FinishPlannedExpenseDialog'
import { useDesktopPageSectionTitle } from '@/shared/hooks/use-desktop-page-section-title'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { PageSection } from '@/shared/ui'

import {
  planningPageMonthBodyClassName,
  planningPageMonthTransitionClassName,
  planningPageShellClassName,
  planningPageToolbarStickyClassName,
} from '../lib/planningPageLayout'
import { usePlanningPage } from '../model/usePlanningPage'

import {
  PlanningPageHeader,
  PlanningPageToolbarSlot,
} from './PlanningPageHeader'
import { PlanningPageMonthBody } from './PlanningPageMonthViews'
import { PlanningPageMonthTransition } from './PlanningPageMonthTransition'

export function PlanningPage() {
  const isMobile = useIsMobile()
  const pageTitle = useDesktopPageSectionTitle('Планирование')
  const page = usePlanningPage()
  const [editingPlanned, setEditingPlanned] = useState<PlannedExpense | null>(
    null,
  )
  const [finishingPlanned, setFinishingPlanned] =
    useState<PlannedExpense | null>(null)

  return (
    <PageSection
      title={pageTitle}
      header={isMobile ? <PlanningPageHeader page={page} /> : undefined}
      mobileSidebarOnHeader={false}
      className="max-md:gap-2"
    >
      <div className={planningPageShellClassName}>
        {!isMobile ? (
          <div className={planningPageToolbarStickyClassName}>
            <PlanningPageToolbarSlot page={page} />
          </div>
        ) : null}

        <PlanningPageMonthTransition
          periodMonth={page.periodMonth}
          className={planningPageMonthTransitionClassName}
        >
          <div className={planningPageMonthBodyClassName}>
            <PlanningPageMonthBody
              page={page}
              onEditPlanned={setEditingPlanned}
              onFinishPlanned={setFinishingPlanned}
            />
          </div>
        </PlanningPageMonthTransition>
      </div>

      <EditPlannedExpenseDialog
        open={editingPlanned != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlanned(null)
          }
        }}
        item={editingPlanned}
        categories={page.expenseCategories}
      />

      <FinishPlannedExpenseDialog
        open={finishingPlanned != null}
        onOpenChange={(open) => {
          if (!open) {
            setFinishingPlanned(null)
          }
        }}
        item={finishingPlanned}
        categories={page.expenseCategories}
      />
    </PageSection>
  )
}
