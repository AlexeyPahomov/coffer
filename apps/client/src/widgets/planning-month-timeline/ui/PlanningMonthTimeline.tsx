import { formatPlanningPeriodLabel } from '@/entities/budget/lib/periodLabels'
import { Carousel, CarouselContent, CarouselItem } from '@/shared/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  planningMonthCarouselContentClassName,
  planningMonthCarouselItemClassName,
  planningMonthCarouselOptions,
  planningMonthCarouselViewportClassName,
  planningMonthNavButtonClassName,
  planningMonthTimelineClassName,
} from '../lib/planningMonthSwitcherLayout'
import { usePlanningMonthCarousel } from '../model/usePlanningMonthCarousel'

import { PlanningMonthCard } from './PlanningMonthCard'

export type PlanningMonthTimelineProps = {
  periodMonth: string
  periodLabels: Record<string, string>
  itemCounts?: Record<string, number>
  itemSwatches?: Record<string, string[]>
  onSelect: (periodMonth: string) => void
  showMeta?: boolean
}

export function PlanningMonthTimeline({
  periodMonth,
  periodLabels,
  itemCounts = {},
  itemSwatches = {},
  onSelect,
  showMeta = true,
}: PlanningMonthTimelineProps) {
  const carousel = usePlanningMonthCarousel({ periodMonth, onSelect })

  return (
    <div className={planningMonthTimelineClassName}>
      <button
        type="button"
        className={planningMonthNavButtonClassName}
        disabled={!carousel.canGoPrev}
        aria-label="Прокрутить карточки назад"
        onClick={carousel.goPrev}
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
      </button>

      <Carousel
        className={planningMonthCarouselViewportClassName}
        setApi={carousel.setCarouselApi}
        opts={planningMonthCarouselOptions}
      >
        <CarouselContent className={planningMonthCarouselContentClassName}>
          {carousel.months.map((month, index) => (
            <CarouselItem
              key={`planning-month-slot-${index}`}
              className={planningMonthCarouselItemClassName}
            >
              <PlanningMonthCard
                label={periodLabels[month] ?? formatPlanningPeriodLabel(month)}
                planCount={itemCounts[month] ?? 0}
                swatches={itemSwatches[month] ?? []}
                active={month === periodMonth}
                onSelect={() => carousel.selectMonth(month)}
                showMeta={showMeta}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <button
        type="button"
        className={planningMonthNavButtonClassName}
        disabled={!carousel.canGoNext}
        aria-label="Прокрутить карточки вперёд"
        onClick={carousel.goNext}
      >
        <ChevronRight className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}
