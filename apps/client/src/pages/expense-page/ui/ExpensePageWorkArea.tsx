import { useCallback, useState } from 'react'

import { useIsMobile } from '@/shared/hooks/use-mobile'
import { usePageListLayout } from '@/shared/hooks/use-page-list-layout'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  MobileFixedStartCorner,
} from '@/shared/ui'
import {
  ExpenseListToolbar,
  type ExpenseListViewMode,
} from '@/widgets/expense-list'

import {
  expensePageWorkCarouselContentClassName,
  expensePageWorkCarouselItemClassName,
  expensePageWorkCarouselOptions,
  expensePageWorkCarouselRootClassName,
  expensePageWorkCarouselViewportClassName,
} from '../lib/expensePageWorkCarouselLayout'
import {
  EXPENSE_PAGE_WORK_SLIDE,
  EXPENSE_PAGE_WORK_SLIDES,
  getExpensePageWorkSlideIndex,
  type ExpensePageWorkSlideId,
} from '../lib/expensePageWorkAreaSlides'
import { useExpensePageWorkCarousel } from '../model/useExpensePageWorkCarousel'
import { useExpensePageWorkAreaContext } from '../model/expensePageWorkAreaContext'

import {
  ExpensePageCategoriesPanel,
  ExpensePageHistoryPanel,
} from './expensePageWorkAreaPanels'
import { ExpensePageWorkAreaSwitcher } from './ExpensePageWorkAreaSwitcher'

export function ExpensePageWorkArea() {
  const isMobile = useIsMobile()
  const listLayout = usePageListLayout()
  const { setCarouselApi, activeIndex, selectSlide } = useExpensePageWorkCarousel()
  const activeSlideId =
    EXPENSE_PAGE_WORK_SLIDES[activeIndex]?.id ?? EXPENSE_PAGE_WORK_SLIDE.categories
  const [historyViewMode, setHistoryViewMode] = useState<ExpenseListViewMode>('list')
  const isHistorySlide = activeSlideId === EXPENSE_PAGE_WORK_SLIDE.history

  const { selectedCategoryId, onCategorySelect, onAddExpense } =
    useExpensePageWorkAreaContext()

  const handleSwitcherSelect = useCallback(
    (slideId: ExpensePageWorkSlideId) => {
      selectSlide(getExpensePageWorkSlideIndex(slideId))
    },
    [selectSlide],
  )

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      const togglingOff = selectedCategoryId === categoryId
      onCategorySelect(categoryId)

      if (!togglingOff) {
        selectSlide(getExpensePageWorkSlideIndex(EXPENSE_PAGE_WORK_SLIDE.history))
      }
    },
    [onCategorySelect, selectSlide, selectedCategoryId],
  )

  return (
    <div className={expensePageWorkCarouselRootClassName}>
      <ExpensePageWorkAreaSwitcher
        activeSlideId={activeSlideId}
        onSelect={handleSwitcherSelect}
        onAddExpense={onAddExpense}
      />

      <Carousel
        className={expensePageWorkCarouselViewportClassName}
        opts={expensePageWorkCarouselOptions}
        setApi={setCarouselApi}
      >
        <CarouselContent className={expensePageWorkCarouselContentClassName}>
          <CarouselItem className={expensePageWorkCarouselItemClassName}>
            <ExpensePageCategoriesPanel
              listLayout={listLayout}
              hideListTitle
              onCategorySelect={handleCategorySelect}
            />
          </CarouselItem>

          <CarouselItem className={expensePageWorkCarouselItemClassName}>
            <ExpensePageHistoryPanel
              listLayout={listLayout}
              hideListTitle
              hideHeaderViewSwitcher={isMobile}
              historyViewMode={historyViewMode}
              onHistoryViewModeChange={setHistoryViewMode}
            />
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {isMobile && isHistorySlide ? (
        <MobileFixedStartCorner>
          <ExpenseListToolbar
            className="pointer-events-auto"
            viewMode={historyViewMode}
            onViewModeChange={setHistoryViewMode}
          />
        </MobileFixedStartCorner>
      ) : null}
    </div>
  )
}
