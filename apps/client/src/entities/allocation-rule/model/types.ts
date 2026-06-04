import type { AllocationRuleLineMode, IncomeStatus, IncomeType } from '@coffer/shared'

import type { Allocation } from '@/entities/allocation/model/types'
import type { Category } from '@/entities/category/model/types'

export type AllocationRuleLine = {
  id: string
  rule_id: string
  category_id: string
  category: Category
  mode: AllocationRuleLineMode
  amount: string | null
  percent: string | null
  position: number
  created_at: string
}

export type AllocationRule = {
  id: string
  user_id: string
  name: string
  trigger_income_type: IncomeType | null
  is_active: boolean
  created_at: string
  updated_at: string
  lines: AllocationRuleLine[]
}

export type AllocationRuleLinePayload = {
  category_id: string
  mode: AllocationRuleLineMode
  amount?: number | null
  percent?: number | null
  position?: number
}

export type AllocationRulePayload = {
  name: string
  trigger_income_type?: IncomeType | null
  is_active?: boolean
  lines: AllocationRuleLinePayload[]
}

export type AllocationRulePreviewLine = {
  category_id: string
  category_name: string
  mode: AllocationRuleLineMode
  amount: number
  percent: number | null
}

export type AllocationRulePreviewRule = {
  rule: {
    id: string
    name: string
    trigger_income_type: IncomeType | null
  }
  lines: AllocationRulePreviewLine[]
  total: number
  remainingAfterApply: number
  exceedsRemaining: boolean
}

export type AllocationRulePreview = {
  income: {
    id: string
    amount: number
    income_type: IncomeType
    status: IncomeStatus
  }
  alreadyAllocated: number
  rules: AllocationRulePreviewRule[]
}

export type ApplyAllocationRulePayload = {
  income_id: string
  rule_id?: string
}

export type ApplyAllocationRuleResult = Allocation[]
