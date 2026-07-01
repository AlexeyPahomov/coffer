import { useCarouselTabs } from '@/shared/hooks/useCarouselTabs'

import { EXPENSE_PAGE_WORK_SLIDES } from '../lib/expensePageWorkAreaSlides'

export function useExpensePageWorkCarousel() {
  return useCarouselTabs(EXPENSE_PAGE_WORK_SLIDES.length)
}
