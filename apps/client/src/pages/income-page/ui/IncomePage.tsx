import { getAppRoute, appRouteNavLabel } from '@/app/config/routes'
import { CreateIncomeFormDialog } from '@/features/create-income/ui/CreateIncomeFormDialog'
import { useDesktopPageSectionTitle } from '@/shared/hooks/use-desktop-page-section-title'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { PageSection } from '@/shared/ui'
import { ContentTransition } from '@/shared/ui/content-transition'
import { planningPageToolbarStickyClassName } from '@/pages/planning-page/lib/planningPageLayout'

import {
  incomePageMonthBodyClassName,
  incomePageMonthTransitionClassName,
  incomePageSectionClassName,
  incomePageShellClassName,
} from '../lib/incomePageLayout'
import { useIncomePage } from '../model/useIncomePage'

import { IncomePageMonthBody } from './IncomePageMonthBody'
import { IncomePageToolbar } from './IncomePageToolbar'
import { ReceiveIncomeWithRulesDialog } from './ReceiveIncomeWithRulesDialog'

const incomeRoute = getAppRoute('income')

export function IncomePage() {
  const isMobile = useIsMobile()
  const pageTitle = useDesktopPageSectionTitle(appRouteNavLabel(incomeRoute))
  const page = useIncomePage()
  const { isPending, isError, error } = page.incomesQuery

  return (
    <PageSection
      title={pageTitle}
      header={isMobile ? <IncomePageToolbar {...page.toolbar} /> : undefined}
      mobileSidebarOnHeader={false}
      className={incomePageSectionClassName}
    >
      <div className={incomePageShellClassName}>
        {!isMobile ? (
          <div className={planningPageToolbarStickyClassName}>
            <IncomePageToolbar {...page.toolbar} />
          </div>
        ) : null}

        <ContentTransition
          contentKey={page.selectedPeriodMonth}
          className={incomePageMonthTransitionClassName}
        >
          <div className={incomePageMonthBodyClassName}>
            <IncomePageMonthBody
              metrics={page.metrics}
              monthIncomes={page.monthIncomes}
              isPending={isPending}
              isError={isError}
              error={error}
              onEditIncome={page.onEditIncome}
              onReceiveIncome={page.onReceiveIncome}
            />
          </div>
        </ContentTransition>
      </div>

      <CreateIncomeFormDialog {...page.formDialog} />
      {page.receiveDialog.income ? (
        <ReceiveIncomeWithRulesDialog
          key={page.receiveDialog.income.id}
          {...page.receiveDialog}
        />
      ) : null}
    </PageSection>
  )
}
