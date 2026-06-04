import { Fragment } from 'react'

import { ArrowRight } from 'lucide-react'

import { formatAmount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

import { buildLiquidityFlowRailNodes } from '../lib/buildLiquidityFlowNodes'
import { liquidityFlowRailLabels } from '../lib/liquidityFlowCopy'
import { liquidityFlowAmountClassName } from '../lib/liquidityFlowLayout'
import {
  liquidityFlowRailAmountClassName,
  liquidityFlowRailArrowClassName,
  liquidityFlowRailCellClassName,
  liquidityFlowRailClassName,
  liquidityFlowRailGridClassName,
  liquidityFlowRailGridColumn,
  liquidityFlowRailLabelClassName,
} from '../lib/liquidityFlowRailLayout'
import type { LiquidityFlowDataProps } from '../lib/liquidityFlowTypes'

export type LiquidityFlowRailProps = LiquidityFlowDataProps

export function LiquidityFlowRail({
  projection,
  expectedIncomeTotal = 0,
}: LiquidityFlowRailProps) {
  const nodes = buildLiquidityFlowRailNodes(projection, expectedIncomeTotal)

  return (
    <div className={liquidityFlowRailClassName} aria-label="Поток ликвидности">
      <div className={liquidityFlowRailGridClassName}>
        {nodes.map((node, index) => (
          <Fragment key={node.kind}>
            <div
              className={liquidityFlowRailCellClassName}
              style={{
                gridColumn: liquidityFlowRailGridColumn(index),
                gridRow: 1,
              }}
            >
              <span className={liquidityFlowRailLabelClassName}>
                {liquidityFlowRailLabels[node.kind]}
              </span>
            </div>

            <div
              className={liquidityFlowRailCellClassName}
              style={{
                gridColumn: liquidityFlowRailGridColumn(index),
                gridRow: 2,
              }}
            >
              <span
                className={cn(
                  liquidityFlowRailAmountClassName,
                  liquidityFlowAmountClassName(node.kind, node.amount),
                )}
              >
                {formatAmount(node.amount)}
              </span>
            </div>

            {index < nodes.length - 1 ? (
              <ArrowRight
                className={liquidityFlowRailArrowClassName}
                style={{
                  gridColumn: liquidityFlowRailGridColumn(index) + 1,
                  gridRow: 2,
                }}
                strokeWidth={2}
                aria-hidden
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
