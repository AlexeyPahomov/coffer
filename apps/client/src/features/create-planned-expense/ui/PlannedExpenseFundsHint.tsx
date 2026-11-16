import { parseMoneyInput } from '@coffer/shared'

import { formatPlanningPeriodLabel } from '@/entities/budget'
import { formatMoneyWithRub } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { InfoHint } from '@/shared/ui'

import type {
  CreatePlannedExpenseFormValues,
  PlannedExpenseAvailableFunds,
} from '../model/types'

type PlannedExpenseFundsHintProps = {
  values: CreatePlannedExpenseFormValues
  periodMonth: string
  funds: PlannedExpenseAvailableFunds
  /** Накопления в подсказке — сумма по всем конвертам, а перевод идёт из одного. */
  hasSeveralSavingsEnvelopes: boolean
}

/** Доступные средства на месяц плана и предупреждения, если разбивка их превышает. */
export function PlannedExpenseFundsHint({
  values,
  periodMonth,
  funds,
  hasSeveralSavingsEnvelopes,
}: PlannedExpenseFundsHintProps) {
  const amount = parseMoneyInput(values.amount) ?? 0
  const savingsAmount = values.savings_category_id
    ? (parseMoneyInput(values.savings_amount) ?? 0)
    : 0
  const mainAmount = Math.max(0, amount - savingsAmount)

  const hasAmount = amount > 0

  return (
    <div className="space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
      <div className="flex items-start gap-1">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          {formatPlanningPeriodLabel(periodMonth)}
        </p>
        <InfoHint label="Доступные средства" className="-my-0.5">
          Доступно — с учётом остальных планов, так, чтобы прогноз не ушёл в
          минус в следующие 12 месяцев.
        </InfoHint>
      </div>
      <FundsRow
        label="Накопления"
        used={hasAmount ? savingsAmount : null}
        available={funds.savings}
      />
      {values.category_id ? (
        hasAmount ? (
          <FundsRow label="Конверт" used={mainAmount} available={null} />
        ) : null
      ) : (
        <FundsRow
          label="Пул"
          used={hasAmount ? mainAmount : null}
          available={funds.pool}
        />
      )}
      {hasSeveralSavingsEnvelopes ? (
        <p>
          Накопления — по всем конвертам; при проведении сумма должна быть в
          выбранном.
        </p>
      ) : null}
    </div>
  )
}

/** Строка источника: «сколько берём из сколько доступно»; превышение — янтарным. */
function FundsRow({
  label,
  used,
  available,
}: {
  label: string
  /** null — сумма плана не введена, показываем только доступное. */
  used: number | null
  /** null — доступное неизвестно (конверт), показываем только сумму. */
  available: number | null
}) {
  const isOver = used !== null && available !== null && used > available

  return (
    <p
      className={cn(
        'flex justify-between gap-3 tabular-nums',
        isOver && 'text-amber-700 dark:text-amber-400',
      )}
    >
      <span>{label}</span>
      <span>
        {used === null
          ? `доступно ${formatMoneyWithRub(available ?? 0)}`
          : available === null
            ? formatMoneyWithRub(used)
            : `${formatMoneyWithRub(used)} из ${formatMoneyWithRub(available)}`}
      </span>
    </p>
  )
}
