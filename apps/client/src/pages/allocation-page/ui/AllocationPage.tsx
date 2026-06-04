import { useRef, useState } from 'react'

import { appRouteLabel } from '@/app/config/routes'
import { isAllocationListBackgroundFetch } from '@/entities/allocation/api/allocationQueryFlags'
import { allocationIncomePercentOrZero } from '@/entities/allocation/model/calculations'
import type { Allocation } from '@/entities/allocation/model/types'
import { useCreateAllocationForm } from '@/features/create-allocation/model/useCreateAllocationForm'
import { useEditAllocationForm } from '@/features/create-allocation/model/useEditAllocationForm'
import {
  allocationPageHeaderClassName,
  allocationPageListScrollClassName,
  allocationPageListUlClassName,
  allocationPageShellClassName,
} from '@/pages/allocation-page/lib/allocationPageLayout'
import { useActiveIncomeScroll } from '@/pages/allocation-page/model/useActiveIncomeScroll'
import { useAllocationPage } from '@/pages/allocation-page/model/useAllocationPage'
import { AllocationFormSheets } from '@/pages/allocation-page/ui/AllocationFormSheets'
import { AllocationIncomeSection } from '@/pages/allocation-page/ui/AllocationIncomeSection'
import { QuickAllocateCta } from '@/pages/allocation-page/ui/QuickAllocateCta'
import { RemainingBalanceCard } from '@/pages/allocation-page/ui/RemainingBalanceCard'
import { useDesktopPageSectionTitle } from '@/shared/hooks/use-desktop-page-section-title'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { ContentTransition } from '@/shared/ui/content-transition'
import { Fab, PageSection, type CarouselApi } from '@/shared/ui'
import { AllocationList } from '@/widgets/allocation-list'

export function AllocationPage() {
  const isMobile = useIsMobile()
  const pageTitle = useDesktopPageSectionTitle(appRouteLabel('allocation'))
  const [allocateSheetOpen, setAllocateSheetOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null,
  )
  const [incomeCarouselApi, setIncomeCarouselApi] = useState<CarouselApi>()
  const desktopIncomeScrollRef = useRef<HTMLDivElement | null>(null)

  const {
    selectedPeriodMonth,
    setPickedPeriodMonth,
    selectedAllocationIncomeId,
    allocationCategories,
    incomeAmount,
    allocatedTotal,
    remainingBalance,
    incomeCards,
    hasIncome,
    allocationsQuery,
  } = useAllocationPage()

  const form = useCreateAllocationForm({
    incomeId: selectedAllocationIncomeId,
    remainingBalance,
  })

  const editForm = useEditAllocationForm({
    allocation: editingAllocation,
    remainingBalance,
    onComplete: () => {
      setEditingAllocation(null)
    },
  })

  const noCategories = allocationCategories.length === 0
  const createDisabled = form.disabled || form.submitting
  const allocatedPercent = allocationIncomePercentOrZero(
    allocatedTotal,
    incomeAmount,
  )

  const selectedIncomeTone =
    incomeCards.find((card) => card.id === selectedPeriodMonth)?.tone ?? 'empty'

  useActiveIncomeScroll(
    selectedPeriodMonth,
    incomeCards,
    incomeCarouselApi,
    desktopIncomeScrollRef,
  )

  async function submitAllocation() {
    await form.submit()
    if (!form.serverError && !form.validationError) {
      setAllocateSheetOpen(false)
    }
  }

  return (
    <PageSection title={pageTitle}>
      <div className={allocationPageShellClassName}>
        <div className={allocationPageHeaderClassName}>
          <AllocationIncomeSection
            hasIncome={hasIncome}
            incomeCards={incomeCards}
            selectedPeriodMonth={selectedPeriodMonth}
            onSelectPeriodMonth={setPickedPeriodMonth}
            desktopIncomeScrollRef={desktopIncomeScrollRef}
            onCarouselApiChange={setIncomeCarouselApi}
          />

          <div className="space-y-4 md:flex md:items-stretch md:gap-4 md:space-y-0">
            <RemainingBalanceCard
              tone={selectedIncomeTone}
              remainingBalance={remainingBalance}
              incomeAmount={incomeAmount}
              allocatedPercent={allocatedPercent}
            />
            <QuickAllocateCta
              disabled={createDisabled || noCategories}
              onClick={() => setAllocateSheetOpen(true)}
            />
          </div>
        </div>

        <ContentTransition
          contentKey={selectedPeriodMonth ?? 'none'}
          className={allocationPageListScrollClassName}
        >
          <AllocationList
            isPending={allocationsQuery.isPending}
            isError={allocationsQuery.isError}
            error={allocationsQuery.error}
            allocations={allocationsQuery.data}
            isFetching={isAllocationListBackgroundFetch(allocationsQuery)}
            hasSelectedMonth={selectedPeriodMonth !== null}
            incomeAmount={incomeAmount}
            layout="fill"
            listClassName={allocationPageListUlClassName}
            onEditAllocation={setEditingAllocation}
          />
        </ContentTransition>
      </div>

      {isMobile ? (
        <Fab
          label="Распределить"
          onClick={() => setAllocateSheetOpen(true)}
          disabled={createDisabled || noCategories}
        />
      ) : null}

      <AllocationFormSheets
        categories={allocationCategories}
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
