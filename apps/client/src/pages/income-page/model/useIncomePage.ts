import { useMemo, useState } from 'react'

import {
  buildIncomeMonthCards,
  countIncomesByPeriodMonth,
  filterIncomesByPeriodMonth,
  resolveSelectedIncomePeriodMonth,
} from '@/entities/income/lib/buildIncomeMonthCards'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import type { Income } from '@/entities/income/model/types'
import { useIncomeFormDialog } from '@/features/create-income/model/useIncomeFormDialog'
import { INCOME_ADD_LABEL } from '@/features/create-income/lib/incomeFormDialogCopy'
import { buildIncomePageMetrics } from '@/pages/income-page/lib/incomePageAnalytics'
import { buildCarouselPeriodLabels } from '@/widgets/planning-month-timeline/lib/buildCarouselPeriodLabels'

export function useIncomePage() {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)

  const incomesQuery = useIncomesQuery()
  const dialog = useIncomeFormDialog(editingIncome, () => setEditingIncome(null))

  const incomes = incomesQuery.data ?? []

  const monthCards = useMemo(() => buildIncomeMonthCards(incomes), [incomes])

  const selectedPeriodMonth = useMemo(
    () =>
      resolveSelectedIncomePeriodMonth(monthCards, pickedPeriodMonth),
    [monthCards, pickedPeriodMonth],
  )

  const metrics = useMemo(
    () => buildIncomePageMetrics(monthCards, selectedPeriodMonth),
    [monthCards, selectedPeriodMonth],
  )

  const monthIncomes = useMemo(
    () => filterIncomesByPeriodMonth(incomes, selectedPeriodMonth),
    [incomes, selectedPeriodMonth],
  )

  const toolbar = useMemo(
    () => ({
      periodMonth: selectedPeriodMonth,
      periodLabels: buildCarouselPeriodLabels(selectedPeriodMonth),
      incomeCounts: countIncomesByPeriodMonth(incomes),
      onSelectMonth: setPickedPeriodMonth,
      onAdd: dialog.openForAdd,
      addLabel: INCOME_ADD_LABEL,
    }),
    [selectedPeriodMonth, incomes, dialog.openForAdd],
  )

  return {
    incomesQuery,
    selectedPeriodMonth,
    toolbar,
    monthIncomes,
    metrics,
    onEditIncome: setEditingIncome,
    formDialog: {
      open: dialog.isOpen,
      onOpenChange: dialog.onOpenChange,
      isEditing: dialog.isEditing,
      onClose: dialog.close,
      editingIncome,
    },
  }
}
