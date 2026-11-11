export const BUDGET_TABS = [
  { id: 'incomes', label: 'Доход' },
  { id: 'allocations', label: 'Распределение' },
] as const

export type BudgetTabId = (typeof BUDGET_TABS)[number]['id']
