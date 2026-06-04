import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import {
  APP_ROUTES,
  appRouteHref,
  appRouteNavLabel,
  type AppRouteId,
} from '@/app/config/routes'
import { Logo } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/shared/ui/sidebar'

import { sidebarLogoClassName } from '../lib/sidebarLayout'
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  PieChart,
  SlidersHorizontal,
  Tag,
} from 'lucide-react'

type IconFn = (props: { className?: string }) => ReactNode

const iconByRouteId: Record<AppRouteId, IconFn> = {
  income: (props) => <DollarSign {...props} />,
  allocation: (props) => <PieChart {...props} />,
  expenses: (props) => <CreditCard {...props} />,
  planning: (props) => <CalendarDays {...props} />,
  rules: (props) => <SlidersHorizontal {...props} />,
  categories: (props) => <Tag {...props} />,
}

function SidebarNavItem({
  to,
  label,
  Icon,
  isActive,
  onNavigate,
}: {
  to: string
  label: string
  Icon: IconFn
  isActive: boolean
  onNavigate?: () => void
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={label}
        size="lg"
        className="rounded-2xl px-3 text-sidebar-foreground/80 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:shadow-sm"
      >
        <NavLink
          to={to}
          aria-label={label}
          onClick={onNavigate}
          className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <Icon />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {label}
          </span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <ShadcnSidebar
      collapsible="icon"
      variant="floating"
      className="hidden md:flex"
    >
      <SidebarHeader className="px-2 py-3">
        <div className="flex h-8 items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Logo
            className={cn(
              sidebarLogoClassName,
              'ml-2 group-data-[collapsible=icon]:hidden',
            )}
          />
          <SidebarTrigger className="hidden shrink-0 md:inline-flex" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {APP_ROUTES.map((route) => {
                const to = appRouteHref(route.segment)
                const Icon = iconByRouteId[route.id]

                return (
                  <SidebarNavItem
                    key={to}
                    to={to}
                    label={appRouteNavLabel(route)}
                    Icon={Icon}
                    isActive={location.pathname === to}
                    onNavigate={handleNavigate}
                  />
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  )
}
