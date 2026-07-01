import {
  carouselTabsContentClassName,
  carouselTabsItemClassName,
  carouselTabsOptions,
  carouselTabsRootClassName,
  carouselTabsViewportClassName,
} from '@/shared/lib/carouselTabsLayout';

/** Общие классы карусели вкладок (совместно со страницей планирования). */
export const expensePageWorkCarouselOptions = carouselTabsOptions;
export const expensePageWorkCarouselRootClassName = carouselTabsRootClassName;
export const expensePageWorkCarouselViewportClassName =
  carouselTabsViewportClassName;
export const expensePageWorkCarouselContentClassName =
  carouselTabsContentClassName;
export const expensePageWorkCarouselItemClassName = carouselTabsItemClassName;

/** Шапка табов и кнопки добавления — вне скролла списка. */
export const expensePageWorkSwitcherBarClassName =
  'relative z-10 w-full min-h-8 shrink-0 px-px pe-2 pb-1 md:min-h-9 md:pe-0 md:pb-3';

/** Десктоп: кнопка поверх правого края шапки, не растягивает табы. */
export const expensePageWorkAddButtonClassName =
  'absolute top-0 right-0 z-10 hidden shrink-0 md:inline-flex';
