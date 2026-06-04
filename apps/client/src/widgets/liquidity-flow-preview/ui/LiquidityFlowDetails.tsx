import type { MonthBudgetProjection } from '@/processes/forecasting'
import { formatAmount } from '@/shared/lib/format'

import {
  liquidityFlowIncomeDetailLabel,
  liquidityFlowNodeLabels,
} from '../lib/liquidityFlowCopy'

export type LiquidityFlowDetailsProps = {
  projection: MonthBudgetProjection
  expectedIncomeTotal: number
}

type DetailLine = {
  label: string
  amount: number
  sign?: '+' | '−' | '='
}

function buildDetailLines(
  projection: MonthBudgetProjection,
  expectedIncomeTotal: number,
): DetailLine[] {
  const optionalLines: DetailLine[] = []

  if (expectedIncomeTotal > 0) {
    optionalLines.push({
      label: liquidityFlowIncomeDetailLabel,
      amount: expectedIncomeTotal,
      sign: '+',
    })
  }

  return [
    ...optionalLines,
    { label: liquidityFlowNodeLabels.pool, amount: projection.available, sign: '+' },
    { label: liquidityFlowNodeLabels.planned, amount: projection.plannedTotal, sign: '−' },
    { label: liquidityFlowNodeLabels.reserved, amount: projection.reservedTotal, sign: '−' },
    {
      label: liquidityFlowNodeLabels.forecast,
      amount: projection.projectedFree,
      sign: '=',
    },
  ]
}

export function LiquidityFlowDetails({
  projection,
  expectedIncomeTotal,
}: LiquidityFlowDetailsProps) {
  const lines = buildDetailLines(projection, expectedIncomeTotal)

  return (
    <div className="space-y-2 text-sm">
      <p className="text-zinc-600">
        Прогноз складывает доступные сейчас деньги и ожидаемые поступления,
        затем вычитает планы и уже зарезервированные суммы.
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
