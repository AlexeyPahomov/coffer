export const allocationRuleKeys = {
  all: ['allocation-rule'] as const,
  lists: () => [...allocationRuleKeys.all, 'list'] as const,
  preview: (incomeId: string, ruleId?: string) =>
    [...allocationRuleKeys.all, 'preview', incomeId, ruleId ?? null] as const,
}
