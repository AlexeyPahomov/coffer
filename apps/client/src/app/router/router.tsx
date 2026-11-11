import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ComponentType, LazyExoticComponent } from 'react'

import { AppLayout } from '@/app/layout/AppLayout'
import {
  APP_DEFAULT_SEGMENT,
  APP_ROUTES,
  appRouteHref,
  type AppRouteId,
} from '@/app/config/routes'

import {
  LazyAllocationPage,
  LazyAllocationRulesPage,
  LazyCategoryPage,
  LazyExpensePage,
  LazyPlanningPage,
} from './lazyPages'

const lazyPageByRouteId: Record<AppRouteId, LazyExoticComponent<ComponentType>> = {
  allocation: LazyAllocationPage,
  expenses: LazyExpensePage,
  planning: LazyPlanningPage,
  rules: LazyAllocationRulesPage,
  categories: LazyCategoryPage,
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={appRouteHref(APP_DEFAULT_SEGMENT)} replace />,
      },
      // Доходы переехали на страницу «Бюджет».
      {
        path: 'income',
        element: <Navigate to={appRouteHref('allocation')} replace />,
      },
      ...APP_ROUTES.map((route) => {
        const Page = lazyPageByRouteId[route.id]
        return { path: route.segment, element: <Page /> }
      }),
    ],
  },
])
