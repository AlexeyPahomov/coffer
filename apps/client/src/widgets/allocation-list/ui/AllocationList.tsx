import { useMemo } from 'react'

import { sortAllocationsByIncomePercentDesc } from '@/entities/allocation/model/calculations'
import type { Allocation } from '@/entities/allocation/model/types'
import { AllocationCard } from '@/entities/allocation/ui/AllocationCard'
import { ItemsList, type ItemsListLayout } from '@/shared/ui'

type AllocationListProps = {
  isPending: boolean
  isError: boolean
  error: unknown
  allocations: Allocation[] | undefined
  isFetching: boolean
  incomeAmount?: number | null
  layout?: ItemsListLayout
  listClassName?: string
  onEditAllocation?: (allocation: Allocation) => void
}

export function AllocationList({
  isPending,
  isError,
  error,
  allocations,
  isFetching,
  incomeAmount = null,
  layout = 'fill',
  listClassName,
  onEditAllocation,
}: AllocationListProps) {
  const sortedAllocations = useMemo(
    () =>
      allocations
        ? sortAllocationsByIncomePercentDesc(allocations, incomeAmount)
        : undefined,
    [allocations, incomeAmount],
  )

  return (
    <ItemsList
      isPending={isPending}
      isError={isError}
      error={error}
      data={sortedAllocations}
      isFetching={isFetching}
      emptyMessage="Пока нет распределений за этот месяц."
      errorFallback="Не удалось загрузить распределения"
      layout={layout}
      listClassName={listClassName}
    >
      {(items) =>
        items.map((allocation) => (
          <li key={allocation.category_id}>
            <AllocationCard
              allocation={allocation}
              incomeAmount={incomeAmount}
              onEdit={onEditAllocation}
            />
          </li>
        ))
      }
    </ItemsList>
  )
}
