import { parseMoneyInput } from '@coffer/shared'

import { formatPlanningPeriodLabel } from '@/entities/budget'
import { formatMoneyWithRub } from '@/shared/lib/format'

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

  const warnings: string[] = []
  if (savingsAmount > funds.savings) {
    warnings.push(
      `В накоплениях не хватит: доступно ${formatMoneyWithRub(Math.max(0, funds.savings))}.`,
    )
  }
  if (!values.category_id && mainAmount > funds.pool) {
    warnings.push(
      `В пуле не хватит ${formatMoneyWithRub(mainAmount - Math.max(0, funds.pool))} — добавьте из накоплений.`,
    )
  }

  return (
    <div className="space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
      <p className="font-medium text-zinc-700 dark:text-zinc-300">
        {formatPlanningPeriodLabel(periodMonth)}: можно потратить из пула{' '}
        {formatMoneyWithRub(funds.pool)} · из накоплений{' '}
        {formatMoneyWithRub(funds.savings)}
      </p>
      <p>
        С учётом остальных планов — так, чтобы прогноз не ушёл в минус в
        следующие 12 месяцев.
      </p>
      {hasSeveralSavingsEnvelopes ? (
        <p>
          Накопления — по всем конвертам; при проведении сумма должна быть в
          выбранном.
        </p>
      ) : null}
      {savingsAmount > 0 && savingsAmount <= amount ? (
        <p>
          Из накоплений {formatMoneyWithRub(savingsAmount)}, остальное{' '}
          {formatMoneyWithRub(mainAmount)} —{' '}
          {values.category_id ? 'из конверта' : 'из пула'}.
        </p>
      ) : null}
      {warnings.map((warning) => (
        <p key={warning} className="text-amber-700 dark:text-amber-400">
          {warning}
        </p>
      ))}
    </div>
  )
}
