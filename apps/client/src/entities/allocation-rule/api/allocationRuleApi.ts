import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client'

import type {
  AllocationRule,
  AllocationRulePayload,
  AllocationRulePreview,
  ApplyAllocationRulePayload,
  ApplyAllocationRuleResult,
} from '../model/types'

const ALLOCATION_RULE_PATH = '/allocation-rules'

export function getAllocationRules(): Promise<AllocationRule[]> {
  return apiGet<AllocationRule[]>(ALLOCATION_RULE_PATH)
}

export function createAllocationRule(
  payload: AllocationRulePayload,
): Promise<AllocationRule> {
  return apiPost<AllocationRule>(ALLOCATION_RULE_PATH, payload)
}

export function updateAllocationRule(
  id: string,
  payload: AllocationRulePayload,
): Promise<AllocationRule> {
  return apiPatch<AllocationRule>(
    `${ALLOCATION_RULE_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
}

export function deleteAllocationRule(id: string): Promise<void> {
  return apiDelete<void>(`${ALLOCATION_RULE_PATH}/${encodeURIComponent(id)}`)
}

export function getAllocationRulePreview(
  incomeId: string,
  ruleId?: string,
): Promise<AllocationRulePreview> {
  const q = new URLSearchParams({ income_id: incomeId })
  if (ruleId) {
    q.set('rule_id', ruleId)
  }
  return apiGet<AllocationRulePreview>(`${ALLOCATION_RULE_PATH}/preview?${q}`)
}

export function applyAllocationRule(
  payload: ApplyAllocationRulePayload,
): Promise<ApplyAllocationRuleResult> {
  return apiPost<ApplyAllocationRuleResult>(
    `${ALLOCATION_RULE_PATH}/apply`,
    payload,
  )
}
