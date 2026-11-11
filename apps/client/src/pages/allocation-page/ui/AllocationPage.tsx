import { useState, type ReactNode } from 'react'

import { PieChart } from 'lucide-react'

import { appRouteLabel } from '@/app/config/routes'
import { isAllocationListBackgroundFetch } from '@/entities/allocation/api/allocationQueryFlags'
import type { Allocation } from '@/entities/allocation/model/types'
import { useCreateAllocationForm } from '@/features/create-allocation/model/useCreateAllocationForm'
import { useEditAllocationForm } from '@/features/create-allocation/model/useEditAllocationForm'
import { INCOME_ADD_LABEL } from '@/features/create-income/lib/incomeFormDialogCopy'
import { CreateIncomeFormDialog } from '@/features/create-income/ui/CreateIncomeFormDialog'
import { useDesktopPageSectionTitle } from '@/shared/hooks/use-desktop-page-section-title'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import {
  carouselTabsContentClassName,
  carouselTabsItemClassName,
  carouselTabsOptions,
  carouselTabsRootClassName,
  carouselTabsViewportClassName,
} from '@/shared/lib/carouselTabsLayout'
import { ContentTransition } from '@/shared/ui/content-transition'
import {
  AddButton,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  Fab,
  ListEmpty,
  PageSection,
  primaryActionButtonClassName,
  SegmentedSwitcher,
} from '@/shared/ui'
import { AllocationList } from '@/widgets/allocation-list'
import { PlanningMonthSelect } from '@/widgets/planning-month-timeline/ui/PlanningMonthSelect'
import { PlanningMonthTimeline } from '@/widgets/planning-month-timeline/ui/PlanningMonthTimeline'

import {
  allocationPageListScrollClassName,
  allocationPageListUlClassName,
  allocationPageShellClassName,
  budgetAllocationListEmptyClassName,
  budgetPageColumnClassName,
  budgetPageColumnsClassName,
} from '../lib/allocationPageLayout'
import { BUDGET_TABS } from '../lib/budgetTabs'
import { useAllocationPage } from '../model/useAllocationPage'

import { AllocationFormSheets } from './AllocationFormSheets'
import { BudgetIncomeList } from './BudgetIncomeList'
import { BudgetSummary } from './BudgetSummary'
import { ReceiveIncomeWithRulesDialog } from './ReceiveIncomeWithRulesDialog'

const ALLOCATE_LABEL = 'Распределить'

function BudgetColumn({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className={budgetPageColumnClassName}>
      {title ? (
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      ) : null}
      {children}
    </section>
  )
}

export function AllocationPage() {
  const isMobile = useIsMobile()
  const pageTitle = useDesktopPageSectionTitle(appRouteLabel('allocation'))
  const page = useAllocationPage()
  const [allocateSheetOpen, setAllocateSheetOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null,
  )

  const form = useCreateAllocationForm({
    incomeId: page.selectedAllocationIncomeId,
    remainingBalance: page.summary.remaining,
  })

  const editForm = useEditAllocationForm({
    allocation: editingAllocation,
    remainingBalance: page.summary.remaining,
    onComplete: () => {
      setEditingAllocation(null)
    },
  })

  const noCategories = page.allocationCategories.length === 0
  const allocateDisabled = form.disabled || form.submitting || noCategories
  async function submitAllocation() {
    await form.submit()
    if (!form.serverError && !form.validationError) {
      setAllocateSheetOpen(false)
    }
  }

  const incomeList = (
    <BudgetIncomeList
      items={page.monthIncomes}
      isPending={page.incomesQuery.isPending}
      isError={page.incomesQuery.isError}
      error={page.incomesQuery.error}
      copyPreviousMonth={page.copyPreviousMonth}
      onEdit={page.onEditIncome}
      onReceive={page.onReceiveIncome}
    />
  )

  const allocationsEmpty =
    !page.allocationsQuery.isPending &&
    !page.allocationsQuery.isError &&
    (page.allocationsQuery.data?.length ?? 0) === 0

  // Пустое состояние не растягиваем на всю колонку — компактный блок в высоту двух строк дохода.
  const allocationList = allocationsEmpty ? (
    <ListEmpty
      message="Пока нет распределений за этот месяц."
      className={budgetAllocationListEmptyClassName}
    />
  ) : (
    <div className={allocationPageListScrollClassName}>
      <AllocationList
        isPending={page.allocationsQuery.isPending}
        isError={page.allocationsQuery.isError}
        error={page.allocationsQuery.error}
        allocations={page.allocationsQuery.data}
        isFetching={isAllocationListBackgroundFetch(page.allocationsQuery)}
        incomeAmount={page.receivedAmount}
        layout="fill"
        listClassName={allocationPageListUlClassName}
        onEditAllocation={setEditingAllocation}
      />
    </div>
  )

  const desktopActions = (
    <div className="flex items-center gap-3">
      <AddButton variant="outline" onClick={page.onAddIncome}>
        {INCOME_ADD_LABEL}
      </AddButton>
      <Button
        size="lg"
        className={primaryActionButtonClassName}
        disabled={allocateDisabled}
        onClick={() => setAllocateSheetOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <PieChart className="size-3" aria-hidden="true" />
          {ALLOCATE_LABEL}
        </span>
      </Button>
      <PlanningMonthSelect
        periodMonth={page.periodMonth}
        onSelect={page.setPeriodMonth}
        pastMonths={12}
      />
    </div>
  )

  const mobileHeader = (
    <PlanningMonthTimeline
      periodMonth={page.periodMonth}
      periodLabels={page.periodLabels}
      onSelect={page.setPeriodMonth}
      showMeta={false}
    />
  )

  return (
    <PageSection
      title={pageTitle}
      headerAction={isMobile ? undefined : desktopActions}
      header={isMobile ? mobileHeader : undefined}
      mobileSidebarOnHeader={false}
      className="max-md:gap-2"
    >
      <div className={allocationPageShellClassName}>
        <ContentTransition
          contentKey={page.periodMonth}
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden max-md:gap-2"
        >
          <BudgetSummary summary={page.summary} />

          {isMobile ? (
            <div className={carouselTabsRootClassName}>
              <div className="pb-2">
                <SegmentedSwitcher
                  items={BUDGET_TABS}
                  activeId={page.activeTabId}
                  onSelect={(id) =>
                    page.selectTabSlide(
                      BUDGET_TABS.findIndex((tab) => tab.id === id),
                    )
                  }
                  ariaLabel="Разделы бюджета"
                />
              </div>
              <Carousel
                className={carouselTabsViewportClassName}
                opts={carouselTabsOptions}
                setApi={page.setTabsCarouselApi}
              >
                <CarouselContent className={carouselTabsContentClassName}>
                  <CarouselItem className={carouselTabsItemClassName}>
                    <BudgetColumn>{incomeList}</BudgetColumn>
                  </CarouselItem>
                  <CarouselItem className={carouselTabsItemClassName}>
                    <BudgetColumn>{allocationList}</BudgetColumn>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <div className={budgetPageColumnsClassName}>
              <BudgetColumn title="Доход">{incomeList}</BudgetColumn>
              <BudgetColumn title="Распределение">
                {allocationList}
              </BudgetColumn>
            </div>
          )}
        </ContentTransition>
      </div>

      {isMobile ? (
        page.activeTabId === 'incomes' ? (
          <Fab label={INCOME_ADD_LABEL} onClick={page.onAddIncome} />
        ) : (
          <Fab
            label={ALLOCATE_LABEL}
            icon={PieChart}
            onClick={() => setAllocateSheetOpen(true)}
            disabled={allocateDisabled}
          />
        )
      ) : null}

      <CreateIncomeFormDialog {...page.incomeFormDialog} />
      {page.receiveDialog.income ? (
        <ReceiveIncomeWithRulesDialog
          key={page.receiveDialog.income.id}
          {...page.receiveDialog}
        />
      ) : null}

      <AllocationFormSheets
        categories={page.allocationCategories}
        noCategories={noCategories}
        createOpen={allocateSheetOpen}
        onCreateOpenChange={setAllocateSheetOpen}
        createForm={form}
        onCreateSubmit={submitAllocation}
        editingAllocation={editingAllocation}
        onEditingAllocationChange={setEditingAllocation}
        editForm={editForm}
        onEditSubmit={() => editForm.submit()}
      />
    </PageSection>
  )
}
