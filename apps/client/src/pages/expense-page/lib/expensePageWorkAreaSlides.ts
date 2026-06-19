export const EXPENSE_PAGE_WORK_SLIDE = {
  categories: 'categories',
  history: 'history',
} as const

export type ExpensePageWorkSlideId =
  (typeof EXPENSE_PAGE_WORK_SLIDE)[keyof typeof EXPENSE_PAGE_WORK_SLIDE]

export const EXPENSE_PAGE_WORK_SLIDES = [
  {
    id: EXPENSE_PAGE_WORK_SLIDE.categories,
    label: 'Конверты',
  },
  {
    id: EXPENSE_PAGE_WORK_SLIDE.history,
    label: 'История расходов',
  },
] as const

export function getExpensePageWorkSlideIndex(slideId: ExpensePageWorkSlideId) {
  return EXPENSE_PAGE_WORK_SLIDES.findIndex((slide) => slide.id === slideId)
}
