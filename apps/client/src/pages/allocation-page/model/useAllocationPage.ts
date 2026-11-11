import { useMemo, useState } from 'react'

import { useAllAllocationsQuery } from '@/entities/allocation/api/useAllAllocationsQuery'
import { filterReceivedAllocations } from '@/entities/allocation/lib/filterReceivedAllocations'
import { pickIncomeWithMaxRemaining } from '@/entities/allocation/lib/pickIncomeWithMaxRemaining'
import { resolveAllocationsForPeriodMonth } from '@/entities/allocation/lib/filterAllocationsByPeriod'
import { sumAllocatedByIncome } from '@/entities/allocation/lib/sumAllocatedByIncome'
import { sumAllocationAmounts } from '@/entities/allocation/model/calculations'
import { useAllocationRulesQuery } from '@/entities/allocation-rule/api/useAllocationRulesQuery'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { isBudgetEnvelopeCategory } from '@/entities/category/lib/categoryKind'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { filterIncomesByPeriodMonth } from '@/entities/income/lib/filterIncomesByPeriodMonth'
import { resolveCurrentCalendarPeriodMonth } from '@/entities/income/lib/incomePeriodMonth'
import type { Income } from '@/entities/income/model/types'
import { useCopyPreviousMonthIncomes } from '@/features/create-income/model/useCopyPreviousMonthIncomes'
import { useIncomeFormDialog } from '@/features/create-income/model/useIncomeFormDialog'
import { combineAllocationListQuery } from '@/pages/allocation-page/lib/combineAllocationListQuery'
import { useCarouselTabs } from '@/shared/hooks/useCarouselTabs'
import { buildCarouselPeriodLabels } from '@/widgets/planning-month-timeline/lib/buildCarouselPeriodLabels'

import { BUDGET_TABS } from '../lib/budgetTabs'
import { buildBudgetSummary } from '../lib/buildBudgetSummary'
import { resolveDefaultBudgetPeriodMonth } from '../lib/resolveDefaultBudgetPeriodMonth'

const EMPTY_INCOMES: Income[] = []

export function useAllocationPage() {
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [receivingIncome, setReceivingIncome] = useState<Income | null>(null)
  const {
    setCarouselApi: setTabsCarouselApi,
    activeIndex: activeTabIndex,
    selectSlide: selectTabSlide,
  } = useCarouselTabs(BUDGET_TABS.length)
  const activeTabId = BUDGET_TABS[activeTabIndex]?.id ?? BUDGET_TABS[0].id

  const incomesQuery = useIncomesQuery()
  const allAllocationsQuery = useAllAllocationsQuery({ enabled: true })
  const categoriesQuery = useCategoriesQuery()
  const rulesQuery = useAllocationRulesQuery()
  const incomeDialog = useIncomeFormDialog(editingIncome, () =>
    setEditingIncome(null),
  )

  const hasActiveRules = (rulesQuery.data ?? []).some((rule) => rule.is_active)
  const incomes = incomesQuery.data ?? EMPTY_INCOMES
  const defaultPeriodMonth = useMemo(
    () =>
      resolveDefaultBudgetPeriodMonth(incomes, resolveCurrentCalendarPeriodMonth()),
    [incomes],
  )
  // Фиксируем месяц по умолчанию после загрузки: иначе получение или удаление
  // дохода перебрасывало бы страницу на другой месяц.
  if (pickedPeriodMonth === null && incomesQuery.isSuccess) {
    setPickedPeriodMonth(defaultPeriodMonth)
  }
  const periodMonth = pickedPeriodMonth ?? defaultPeriodMonth

  const monthIncomes = useMemo(
    () => filterIncomesByPeriodMonth(incomes, periodMonth),
    [incomes, periodMonth],
  )

  const allocatedByIncome = useMemo(
    () => sumAllocatedByIncome(allAllocationsQuery.data ?? []),
    [allAllocationsQuery.data],
  )

  const selectedAllocationIncomeId = useMemo(
    () => pickIncomeWithMaxRemaining(monthIncomes, allocatedByIncome),
    [allocatedByIncome, monthIncomes],
  )

  const monthAllocations = useMemo(
    () =>
      resolveAllocationsForPeriodMonth(
        filterReceivedAllocations(allAllocationsQuery.data ?? []),
        periodMonth,
      ),
    [allAllocationsQuery.data, periodMonth],
  )

  const allocationCategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter((category) =>
        isBudgetEnvelopeCategory(category.type),
      ),
    [categoriesQuery.data],
  )

  const allocatedTotal = useMemo(
    () => sumAllocationAmounts(monthAllocations),
    [monthAllocations],
  )

  const summary = useMemo(
    () => buildBudgetSummary(monthIncomes, allocatedTotal),
    [monthIncomes, allocatedTotal],
  )

  const periodLabels = useMemo(
    () => buildCarouselPeriodLabels(periodMonth),
    [periodMonth],
  )

  const copyPreviousMonth = useCopyPreviousMonthIncomes(incomes, periodMonth)

  const allocationsQuery = combineAllocationListQuery(
    monthAllocations,
    allAllocationsQuery,
    incomesQuery,
  )

  return {
    periodMonth,
    setPeriodMonth: setPickedPeriodMonth,
    periodLabels,
    activeTabId,
    setTabsCarouselApi,
    selectTabSlide,
    summary,
    incomesQuery,
    monthIncomes,
    copyPreviousMonth: {
      ...copyPreviousMonth,
      copy: () => void copyPreviousMonth.copy(),
    },
    selectedAllocationIncomeId,
    allocationCategories,
    // null — в месяце ещё нет полученного дохода.
    receivedAmount: summary.received > 0 ? summary.received : null,
    allocationsQuery,
    onAddIncome: incomeDialog.openForAdd,
    onEditIncome: setEditingIncome,
    onReceiveIncome: setReceivingIncome,
    incomeFormDialog: {
      open: incomeDialog.isOpen,
      onOpenChange: incomeDialog.onOpenChange,
      isEditing: incomeDialog.isEditing,
      onClose: incomeDialog.close,
      editingIncome,
      defaultPeriodMonth: periodMonth,
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
