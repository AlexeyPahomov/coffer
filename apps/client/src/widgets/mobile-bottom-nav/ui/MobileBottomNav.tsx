import {
  CalendarDays,
  CreditCard,
  DollarSign,
  PieChart,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import {
  APP_ROUTES,
  appRouteHref,
  appRouteMobileNavLabel,
  type AppRouteId,
} from '@/app/config/routes'
import { cn } from '@/shared/lib/utils'

type IconFn = (props: { className?: string }) => ReactNode

const iconByRouteId: Record<AppRouteId, IconFn> = {
  income: (props) => <DollarSign {...props} />,
  allocation: (props) => <PieChart {...props} />,
  expenses: (props) => <CreditCard {...props} />,
  planning: (props) => <CalendarDays {...props} />,
  rules: (props) => <SlidersHorizontal {...props} />,
  categories: (props) => <Tag {...props} />,
}

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
      <ul
        className="grid h-16 px-1 pb-[env(safe-area-inset-bottom)]"
        style={{ gridTemplateColumns: `repeat(${APP_ROUTES.length}, minmax(0, 1fr))` }}
      >
        {APP_ROUTES.map((route) => {
          const to = appRouteHref(route.segment)
          const Icon = iconByRouteId[route.id]
          const isActive = location.pathname === to

          return (
            <li key={to} className="min-w-0">
              <NavLink
                to={to}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-slate transition-colors',
                  isActive
                    ? 'bg-slate-subtle text-slate-hover'
                    : 'hover:bg-slate-subtle/80 hover:text-slate-hover',
                )}
              >
                <Icon className={cn('size-4', isActive && 'text-slate-hover')} />
                <span className="truncate">
                  {appRouteMobileNavLabel(route)}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
