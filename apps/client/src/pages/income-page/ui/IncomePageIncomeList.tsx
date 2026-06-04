import type { Income } from '@/entities/income/model/types'
import { IncomeEntryCard } from '@/entities/income/ui/IncomeEntryCard'
import { useDeleteIncomeMutation } from '@/entities/income/api/useDeleteIncomeMutation'
import { useReceiveIncomeMutation } from '@/entities/income/api/useReceiveIncomeMutation'
import {
  incomePageListEmptyClassName,
  incomePageListUlClassName,
} from '@/pages/income-page/lib/incomePageLayout'
import { getErrorMessage } from '@/shared/lib/errors'
import { ListEmpty, ListError, ListLoader } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

type IncomePageIncomeListProps = {
  items: Income[]
  isPending: boolean
  isError: boolean
  error: unknown
  onEdit?: (income: Income) => void
}

export function IncomePageIncomeList({
  items,
  isPending,
  isError,
  error,
  onEdit,
}: IncomePageIncomeListProps) {
  const deleteMutation = useDeleteIncomeMutation()
  const receiveMutation = useReceiveIncomeMutation()

  if (isPending) {
    return (
      <div className="flex flex-col py-4">
        <ListLoader />
      </div>
    )
  }

  if (isError) {
    return <ListError error={error} fallbackMessage="Не удалось загрузить доходы" />
  }

  if (items.length === 0) {
    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className={incomePageListEmptyClassName}>
          <ListEmpty message="Пока нет доходов за выбранный месяц. Добавьте первую запись." />
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {deleteMutation.isError ? (
        <p className="mb-3 text-sm text-destructive">
          {getErrorMessage(deleteMutation.error, 'Не удалось удалить доход')}
        </p>
      ) : null}
      {receiveMutation.isError ? (
        <p className="mb-3 text-sm text-destructive">
          {getErrorMessage(receiveMutation.error, 'Не удалось получить доход')}
        </p>
      ) : null}

      <ul
        className={cn(
          'coffer-scroll-list min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-auto',
          incomePageListUlClassName,
        )}
      >
        {items.map((income) => (
          <li key={income.id}>
            <IncomeEntryCard
              income={income}
              onEdit={onEdit}
              isReceiving={
                receiveMutation.isPending &&
                receiveMutation.variables === income.id
              }
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables === income.id
              }
              onReceive={() => {
                receiveMutation.reset()
                receiveMutation.mutate(income.id)
              }}
              onDelete={() => {
                deleteMutation.reset()
                deleteMutation.mutate(income.id)
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
