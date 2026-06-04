import { useMemo, useState } from 'react'
import { sumMoneyAmounts } from '@coffer/shared'

import { useAllAllocationsQuery } from '@/entities/allocation/api/useAllAllocationsQuery'
import { pickIncomeWithMaxRemaining } from '@/entities/allocation/lib/pickIncomeWithMaxRemaining'
import { resolveAllocationsForPeriodMonth } from '@/entities/allocation/lib/filterAllocationsByPeriod'
import { sumAllocatedByIncome } from '@/entities/allocation/lib/sumAllocatedByIncome'
import { sumAllocationAmounts } from '@/entities/allocation/model/calculations'
import { useCategoriesQuery } from '@/entities/category/api/useCategoriesQuery'
import { isBudgetEnvelopeCategory } from '@/entities/category/lib/categoryKind'
import { useIncomesQuery } from '@/entities/income/api/useIncomesQuery'
import { buildAllocationIncomeCards } from '@/pages/allocation-page/lib/buildAllocationIncomeCards'
import {
  filterIncomesByPeriodMonth,
  resolveSelectedAllocationPeriodMonth,
} from '@/pages/allocation-page/lib/allocationPeriodMonth'
import { combineAllocationListQuery } from '@/pages/allocation-page/lib/combineAllocationListQuery'
import { formatMonthLabel } from '@/shared/lib/format'

export type { IncomeCardTone, IncomeCardView } from '@/pages/allocation-page/lib/allocationIncomeCard'

export function useAllocationPage() {
  const [pickedPeriodMonth, setPickedPeriodMonth] = useState<string | null>(null)

  const incomesQuery = useIncomesQuery()
  const allAllocationsQuery = useAllAllocationsQuery()
  const categoriesQuery = useCategoriesQuery()

  const incomes = incomesQuery.data ?? []

  const allocatedByIncome = useMemo(
    () => sumAllocatedByIncome(allAllocationsQuery.data ?? []),
    [allAllocationsQuery.data],
  )

  const incomeCards = useMemo(
    () => buildAllocationIncomeCards(incomes, allocatedByIncome),
    [allocatedByIncome, incomes],
  )

  const selectedPeriodMonth = useMemo(
    () =>
      resolveSelectedAllocationPeriodMonth(
        incomeCards,
        incomes,
        pickedPeriodMonth,
      ),
    [incomeCards, incomes, pickedPeriodMonth],
  )

  const incomesInSelectedMonth = useMemo(
    () => filterIncomesByPeriodMonth(incomes, selectedPeriodMonth),
    [incomes, selectedPeriodMonth],
  )

  const selectedAllocationIncomeId = useMemo(
    () => pickIncomeWithMaxRemaining(incomesInSelectedMonth, allocatedByIncome),
    [allocatedByIncome, incomesInSelectedMonth],
  )

  const monthAllocations = useMemo(() => {
    if (selectedPeriodMonth === null) {
      return []
    }

    return resolveAllocationsForPeriodMonth(
      allAllocationsQuery.data ?? [],
      selectedPeriodMonth,
    )
  }, [allAllocationsQuery.data, selectedPeriodMonth])

  const allocationCategories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter((category) =>
        isBudgetEnvelopeCategory(category.type),
      ),
    [categoriesQuery.data],
  )

  const incomeAmount = useMemo(() => {
    if (incomesInSelectedMonth.length === 0) {
      return null
    }
    return sumMoneyAmounts(incomesInSelectedMonth.map((income) => income.amount))
  }, [incomesInSelectedMonth])

  const selectedPeriodMonthLabel = selectedPeriodMonth
    ? formatMonthLabel(`${selectedPeriodMonth}-01`)
    : 'Месяц'

  const allocatedTotal = useMemo(
    () => sumAllocationAmounts(monthAllocations),
    [monthAllocations],
  )

  const remainingBalance = useMemo(() => {
    if (incomeAmount === null) {
      return 0
    }
    return incomeAmount - allocatedTotal
  }, [incomeAmount, allocatedTotal])

  const allocationsQuery = combineAllocationListQuery(
    monthAllocations,
    allAllocationsQuery,
    incomesQuery,
  )

  return {
    selectedPeriodMonth,
    setPickedPeriodMonth,
    selectedAllocationIncomeId,
    allocationCategories,
    incomeAmount,
    selectedPeriodMonthLabel,
    allocatedTotal,
    remainingBalance,
    incomeCards,
    hasIncome: incomeCards.length > 0,
    incomesQuery,
    allocationsQuery,
  }
}
