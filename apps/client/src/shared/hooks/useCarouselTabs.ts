import { useCallback, useEffect, useState } from 'react'

import type { CarouselApi } from '@/shared/ui/carousel'

/**
 * Связка embla-карусели с сегментированным переключателем вкладок:
 * отслеживает активный слайд и умеет скроллить к нужному индексу.
 */
export function useCarouselTabs(slideCount: number) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const syncIndex = () => {
      setActiveIndex(carouselApi.selectedScrollSnap())
    }

    carouselApi.on('select', syncIndex)
    carouselApi.on('reInit', syncIndex)
    syncIndex()

    return () => {
      carouselApi.off('select', syncIndex)
      carouselApi.off('reInit', syncIndex)
    }
  }, [carouselApi])

  const selectSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slideCount) {
        return
      }

      carouselApi?.scrollTo(index)
    },
    [carouselApi, slideCount],
  )

  return { carouselApi, setCarouselApi, activeIndex, selectSlide }
}
