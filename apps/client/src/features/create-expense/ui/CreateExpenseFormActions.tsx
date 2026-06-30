import { useCollapsePresence } from '@/shared/hooks/useCollapsePresence'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

import type { SavingsTransferHint } from '../lib/savingsTransferHint'
import type { ExpenseBudgetPreview } from '../model/budget'

import { ExpenseBudgetPreviewInline } from './ExpenseBudgetPreviewInline'
import { ExpenseOverBudgetActions } from './ExpenseOverBudgetActions'

type CreateExpenseFormActionsProps = {
  budgetPreview: ExpenseBudgetPreview | null
  showOverBudgetActions: boolean
  savingsTransfer: SavingsTransferHint | null
  noCategories: boolean
  isBusy: boolean
  isRecording: boolean
  isTopUpPending: boolean
  isCoverPending: boolean
  topUpError: string | null
  canTopUp: boolean
  onQuickTopUp: (amount: number) => void
  onCoverFromSavings?: () => void
  submitLabel: string
  onCancelEdit?: () => void
  /** Без collapse-анимации превью (модалка). */
  staticPreview?: boolean
}

export function CreateExpenseFormActions({
  budgetPreview,
  showOverBudgetActions,
  savingsTransfer,
  noCategories,
  isBusy,
  isRecording,
  isTopUpPending,
  isCoverPending,
  topUpError,
  canTopUp,
  onQuickTopUp,
  onCoverFromSavings,
  submitLabel,
  onCancelEdit,
  staticPreview = false,
}: CreateExpenseFormActionsProps) {
  const previewPresence = useCollapsePresence(
    budgetPreview !== null,
    budgetPreview,
  )

  const previewBlock =
    budgetPreview != null ? (
      staticPreview ? (
        <ExpenseBudgetPreviewInline preview={budgetPreview} />
      ) : previewPresence.isMounted && previewPresence.displayValue ? (
        <div
          className={cn(
            'coffer-collapse grid',
            previewPresence.isOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0',
          )}
          aria-hidden={!previewPresence.isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn(
                previewPresence.isOpen && 'coffer-budget-preview-enter',
              )}
            >
              <ExpenseBudgetPreviewInline
                preview={previewPresence.displayValue}
              />
            </div>
          </div>
        </div>
      ) : null
    ) : null

  return (
    <div className="space-y-3">
      {previewBlock}

      {showOverBudgetActions ? (
        <ExpenseOverBudgetActions
          savingsTransfer={savingsTransfer}
          onQuickTopUp={onQuickTopUp}
          onCoverFromSavings={onCoverFromSavings}
          isRecording={isRecording}
          isTopUpPending={isTopUpPending}
          isCoverPending={isCoverPending}
          topUpError={topUpError}
          canTopUp={canTopUp}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          variant="default"
          isLoading={isRecording}
          size="lg"
          className="min-w-40"
          disabled={isBusy || noCategories}
        >
          {submitLabel}
        </Button>
        {onCancelEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isBusy}
            onClick={onCancelEdit}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </div>
  )
}
