import { lazy } from 'react'

export const LazyAllocationPage = lazy(async () =>
  import('@/pages/allocation-page').then((m) => ({ default: m.AllocationPage })),
)

export const LazyCategoryPage = lazy(async () =>
  import('@/pages/category-page').then((m) => ({ default: m.CategoryPage })),
)

export const LazyExpensePage = lazy(async () =>
  import('@/pages/expense-page').then((m) => ({ default: m.ExpensePage })),
)

export const LazyIncomePage = lazy(async () =>
  import('@/pages/income-page').then((m) => ({ default: m.IncomePage })),
)

export const LazyPlanningPage = lazy(async () =>
  import('@/pages/planning-page').then((m) => ({ default: m.PlanningPage })),
)

export const LazyAllocationRulesPage = lazy(async () =>
  import('@/pages/allocation-rules-page').then((m) => ({
    default: m.AllocationRulesPage,
  })),
)
