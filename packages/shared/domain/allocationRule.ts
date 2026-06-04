export const ALLOCATION_RULE_LINE_MODES = ['FIXED', 'PERCENT'] as const

export type AllocationRuleLineMode =
  (typeof ALLOCATION_RULE_LINE_MODES)[number]

export const DEFAULT_ALLOCATION_RULE_LINE_MODE: AllocationRuleLineMode = 'FIXED'

export function isAllocationRuleLineMode(
  value: string,
): value is AllocationRuleLineMode {
  return (ALLOCATION_RULE_LINE_MODES as readonly string[]).includes(value)
}
