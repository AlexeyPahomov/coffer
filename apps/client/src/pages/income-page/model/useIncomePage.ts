import { useMemo, useState } from 'react'

import {
  buildIncomeMonthCards,
  countIncomesByPeriodMonth,
  filterIncomesByPeriodMonth,
  resolveSelectedIncomePeriodMonth,
} from '@/entities/income/lib/buildIncomeMonthCards'
import { useAllocationRulesQuery } from '@/entities/allocation-rule/api/useAllocationRulesQuery'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import type { Income } from '@/entities/income/model/types'
import { useIncomeFormDialog } from '@/features/create-income/model/useIncomeFormDialog'
import { INCOME_ADD_LABEL } from '@/features/create-income/lib/incomeFormDialogCopy'
import { buildIncomePageMetrics } from '@/pages/income-page/lib/incomePageAnalytics'
import { buildCarouselPeriodLabels } from '@/widgets/planning-month-timeline/lib/buildCarouselPeriodLabels'

export function useIncomePage() {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [receivingIncome, setReceivingIncome] = useState<Income | null>(null)
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)

  const incomesQuery = useIncomesQuery()
  const rulesQuery = useAllocationRulesQuery()
  const dialog = useIncomeFormDialog(editingIncome, () => setEditingIncome(null))

  const hasActiveRules = (rulesQuery.data ?? []).some((rule) => rule.is_active)

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
    onReceiveIncome: setReceivingIncome,
    formDialog: {
      open: dialog.isOpen,
      onOpenChange: dialog.onOpenChange,
      isEditing: dialog.isEditing,
      onClose: dialog.close,
      editingIncome,
      // Доход, полученный прямо через форму, минует кнопку «Получить» —
      // предлагаем правила здесь, но только если они вообще есть.
      onReceived: (income: Income) => {
        if (hasActiveRules) {
          setReceivingIncome(income)
        }
      },
    },
    receiveDialog: {
      income: receivingIncome,
      open: receivingIncome != null,
      onOpenChange: (open: boolean) => {
        if (!open) {
          setReceivingIncome(null)
        }
      },
    },
  }
}
