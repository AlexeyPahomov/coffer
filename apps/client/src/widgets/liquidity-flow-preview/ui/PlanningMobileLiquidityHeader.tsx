import { cn } from '@/shared/lib/utils'
import { InfoHint } from '@/shared/ui'

import { formatLiquidityFlowA11ySummary } from '../lib/formatLiquidityFlowA11y'
import {
  planningMobileLiquidityHeaderClassName,
  planningMobileLiquidityInfoHintClassName,
} from '../lib/planningMobileLiquidityLayout'
import type { LiquidityFlowDataProps } from '../lib/liquidityFlowTypes'

import { LiquidityFlowDetails } from './LiquidityFlowDetails'
import { LiquidityFlowRail } from './LiquidityFlowRail'

export type PlanningMobileLiquidityHeaderProps = LiquidityFlowDataProps & {
  className?: string
}

export function PlanningMobileLiquidityHeader({
  projection,
  expectedIncomeTotal = 0,
  className,
}: PlanningMobileLiquidityHeaderProps) {
  return (
    <section
      className={cn(planningMobileLiquidityHeaderClassName, className)}
    >
      <InfoHint
        label="Ликвидность месяца"
        align="end"
        className={planningMobileLiquidityInfoHintClassName}
      >
        <LiquidityFlowDetails
          projection={projection}
          expectedIncomeTotal={expectedIncomeTotal}
        />
      </InfoHint>

      <LiquidityFlowRail
        projection={projection}
        expectedIncomeTotal={expectedIncomeTotal}
      />

      <p className="sr-only">
        {formatLiquidityFlowA11ySummary(projection, expectedIncomeTotal)}
      </p>
    </section>
  )
}
