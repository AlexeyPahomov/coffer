import { ListError } from '@/shared/ui'

/** Без сводки за месяц клиентский fallback даёт неверные суммы — показываем ошибку. */
export const PERIOD_LEDGER_SUMMARY_ERROR_MESSAGE =
  'Не удалось загрузить сводку за месяц — данные недоступны'

export function PeriodLedgerSummaryError({
  className,
  message = PERIOD_LEDGER_SUMMARY_ERROR_MESSAGE,
}: {
  className?: string
  message?: string
}) {
  return (
    <div className={className}>
      <ListError error={null} fallbackMessage={message} />
    </div>
  )
}
