import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { formatMoneyWithRub } from '@/shared/lib/format'

export const finishPlannedExpenseDialogTitle = 'Провести расход'

export const finishPlannedExpenseDialogDescription =
  'Зафиксируйте фактическую сумму — резерв по плану будет снят, расход попадёт в выбранную категорию.'

export const finishPlannedExpenseSubmitLabel = 'Провести расход'

export function formatFinishPlannedExpenseReserveSummary(
  item: Pick<PlannedExpense, 'amount' | 'reserved_amount'>,
): string | null {
  if (item.reserved_amount <= 0) {
    return null
  }

  if (item.amount === item.reserved_amount) {
    return `В резерве: ${formatMoneyWithRub(item.reserved_amount)}`
  }

  return `В резерве: ${formatMoneyWithRub(item.reserved_amount)} · план ${formatMoneyWithRub(item.amount)}`
}
