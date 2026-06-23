import { resolvePlannedExpenseCategory } from '@/entities/planned-expense/lib/resolvePlannedExpenseCategory'
import { canFinishPlannedExpense } from '@/entities/planned-expense/lib/canFinishPlannedExpense'
import { canUnfinishPlannedExpense } from '@/entities/planned-expense/lib/canUnfinishPlannedExpense'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { PlannedExpenseCard } from '@/entities/planned-expense/ui/PlannedExpenseCard'
import { PlannedExpensesList } from '@/entities/planned-expense/ui/PlannedExpensesList'

import { planningPlansListTitle } from '../lib/planningPageCopy'
import {
  planningPagePlannedListBodyClassName,
  planningPagePlansSectionClassName,
} from '../lib/planningPageLayout'
import type { usePlanningPage } from '../model/usePlanningPage'

type PlanningPagePlansSectionProps = {
  page: ReturnType<typeof usePlanningPage>
  onEditPlanned: (item: PlannedExpense) => void
  onFinishPlanned: (item: PlannedExpense) => void
}

export function PlanningPagePlansSection({
  page,
  onEditPlanned,
  onFinishPlanned,
}: PlanningPagePlansSectionProps) {
  return (
    <div className={planningPagePlansSectionClassName}>
      {page.periodPlanned.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Нет запланированных трат на этот месяц.
        </p>
      ) : (
        <PlannedExpensesList
          title={planningPlansListTitle(page.periodMonth)}
          bodyClassName={planningPagePlannedListBodyClassName}
        >
          {page.periodPlanned.map((item) => (
            <PlannedExpenseCard
              key={item.id}
              item={item}
              category={resolvePlannedExpenseCategory(
                item,
                page.expenseCategories,
              )}
              onReserve={(id) => page.reserve(id, item.amount)}
              onDeletePlan={page.deletePlan}
              onUnreserve={page.unreserve}
              onFinish={
                canFinishPlannedExpense(item) ? onFinishPlanned : undefined
              }
              onUnfinish={
                canUnfinishPlannedExpense(item) ? page.unfinish : undefined
              }
              onEdit={
                item.status === 'PLANNED' ? onEditPlanned : undefined
              }
              pendingStatusMutation={page.pendingStatusMutation}
              pendingDeletePlanId={page.pendingDeletePlanId}
              pendingUnfinishId={page.pendingUnfinishId}
            />
          ))}
        </PlannedExpensesList>
      )}
    </div>
  )
}
