import { Fragment } from 'react'

import { cn } from '@/shared/lib/utils'
import { InfoHint } from '@/shared/ui'
import { infoHintTitleTextClassName } from '@/shared/ui/info-hint/infoHintLayout'

import { buildLiquidityFlowNodes } from '../lib/buildLiquidityFlowNodes'
import {
  liquidityFlowCardClassName,
  liquidityFlowHeaderClassName,
  liquidityFlowTitleClassName,
  liquidityFlowTrackClassName,
  liquidityFlowTrackScrollClassName,
} from '../lib/liquidityFlowLayout'
import type { LiquidityFlowDataProps } from '../lib/liquidityFlowTypes'

import { LiquidityFlowArrow } from './LiquidityFlowArrow'
import { LiquidityFlowDetails } from './LiquidityFlowDetails'
import { LiquidityFlowNode } from './LiquidityFlowNode'

export type MonthLiquidityFlowProps = LiquidityFlowDataProps & {
  className?: string
}

export function MonthLiquidityFlow({
  projection,
  expectedIncomeTotal = 0,
  className,
}: MonthLiquidityFlowProps) {
  const nodes = buildLiquidityFlowNodes(projection, expectedIncomeTotal)

  return (
    <section className={cn(liquidityFlowCardClassName, className)}>
      <div className={liquidityFlowHeaderClassName}>
        <h2 className={cn(liquidityFlowTitleClassName, infoHintTitleTextClassName)}>
          Поток ликвидности
        </h2>
        <InfoHint label="Поток ликвидности" align="end" className="shrink-0">
          <LiquidityFlowDetails
            projection={projection}
            expectedIncomeTotal={expectedIncomeTotal}
          />
        </InfoHint>
      </div>

      <div className={liquidityFlowTrackScrollClassName}>
        <div className={liquidityFlowTrackClassName}>
          {nodes.map((node, index) => (
            <Fragment key={node.kind}>
              <LiquidityFlowNode node={node} />
              {index < nodes.length - 1 ? <LiquidityFlowArrow /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
