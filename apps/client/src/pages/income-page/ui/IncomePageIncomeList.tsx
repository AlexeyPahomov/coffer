import type { Income } from '@/entities/income/model/types'
import { IncomeEntryCard } from '@/entities/income/ui/IncomeEntryCard'
import { useDeleteIncomeMutation } from '@/entities/income/api/useDeleteIncomeMutation'
import {
  incomePageListEmptyClassName,
  incomePageListUlClassName,
} from '@/pages/income-page/lib/incomePageLayout'
import { getErrorMessage } from '@/shared/lib/errors'
import { Button, ListEmpty, ListError, ListLoader } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

export type IncomePageCopyPreviousMonth = {
  count: number
  copy: () => void
  isCopying: boolean
  error: unknown
}

type IncomePageIncomeListProps = {
  items: Income[]
  isPending: boolean
  isError: boolean
  error: unknown
  copyPreviousMonth: IncomePageCopyPreviousMonth
  onEdit?: (income: Income) => void
  onReceive: (income: Income) => void
}

export function IncomePageIncomeList({
  items,
  isPending,
  isError,
  error,
  copyPreviousMonth,
  onEdit,
  onReceive,
}: IncomePageIncomeListProps) {
  const deleteMutation = useDeleteIncomeMutation()

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
          <ListEmpty
            message="Пока нет доходов за выбранный месяц. Добавьте первую запись."
            action={
              copyPreviousMonth.count > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={copyPreviousMonth.isCopying}
                    onClick={copyPreviousMonth.copy}
                  >
                    Как в прошлом месяце ({copyPreviousMonth.count})
                  </Button>
                  {copyPreviousMonth.error ? (
                    <p className="text-sm text-destructive">
                      {getErrorMessage(
                        copyPreviousMonth.error,
                        'Не удалось скопировать доходы',
                      )}
                    </p>
                  ) : null}
                </div>
              ) : undefined
            }
          />
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
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables === income.id
              }
              onReceive={() => onReceive(income)}
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
