import type { MonthBudgetProjection } from '@/processes/forecasting'
import { formatAmount } from '@/shared/lib/format'

import { buildLiquidityFlowDetailLines } from '../lib/buildLiquidityFlowDetailLines'

export type LiquidityFlowDetailsProps = {
  projection: MonthBudgetProjection
  expectedIncomeTotal: number
}

export function LiquidityFlowDetails({
  projection,
  expectedIncomeTotal,
}: LiquidityFlowDetailsProps) {
  const lines = buildLiquidityFlowDetailLines(projection, expectedIncomeTotal)

  return (
    <div className="space-y-2 text-sm">
      <p className="text-zinc-600">
        Прогноз складывает доступные сейчас деньги и ожидаемые поступления,
        вычитает прогноз распределения по конвертам, затем планы и уже
        зарезервированные суммы.
      </p>
      <ul className="space-y-1.5 font-mono tabular-nums text-zinc-800">
        {lines.map((line) => (
          <li
            key={line.label}
            className="flex items-baseline justify-between gap-4"
          >
            <span className="text-zinc-500">
              {line.sign ? `${line.sign} ` : ''}
              {line.label}
            </span>
            <span>{formatAmount(line.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
