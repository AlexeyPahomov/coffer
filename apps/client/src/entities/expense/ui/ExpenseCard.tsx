import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'

import type { Expense } from '@/entities/expense/model/types'
import {
  categoryCardPressableClassName,
  categoryCardPressingClassName,
} from '@/entities/category/lib/categoryTileLayout'
import type { CategoryType } from '@coffer/shared'
import { formatExpenseDate, formatMoneyWithRub } from '@/shared/lib/format'
import { useCardActivate } from '@/shared/hooks/use-card-activate'
import { useLongPress } from '@/shared/hooks/use-long-press'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

import { ExpenseCategoryBadge } from './ExpenseCategoryBadge'

type ExpenseCardProps = {
  expense: Expense
  categoryName: string
  categoryType: CategoryType
  categoryIcon?: string | null
  onEdit?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export function ExpenseCard({
  expense,
  categoryName,
  categoryType,
  categoryIcon,
  onEdit,
  onDelete,
  isDeleting = false,
}: ExpenseCardProps) {
  const description = expense.description?.trim()
  const title = description || categoryName

  const handleEdit = useCallback(() => {
    onEdit?.()
  }, [onEdit])

  const isEditable = onEdit != null

  const { isPressing, longPressHandlers } = useLongPress({
    onLongPress: handleEdit,
    disabled: !isEditable,
  })

  const activateProps = useCardActivate(handleEdit, {
    contextMenu: isEditable,
    ariaLabel: isEditable
      ? `${title}, ${formatMoneyWithRub(expense.amount)}. Удерживайте для редактирования.`
      : undefined,
  })

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-zinc-200/80',
        isEditable && categoryCardPressableClassName,
        isPressing && categoryCardPressingClassName,
        !isEditable && 'transition-colors hover:bg-zinc-50/60',
      )}
      {...(isEditable ? activateProps : {})}
      {...(isEditable ? longPressHandlers : {})}
    >
      <ExpenseCategoryBadge
        name={categoryName}
        categoryType={categoryType}
        icon={categoryIcon}
      />

      {description ? (
        <span className="hidden min-w-0 flex-1 truncate text-sm text-zinc-500 sm:block">
          {description}
        </span>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}

      <span className="ml-auto shrink-0 text-base font-bold tabular-nums text-slate">
        {formatMoneyWithRub(expense.amount)}
      </span>

      <span className="hidden shrink-0 text-sm tabular-nums text-zinc-500 md:inline">
        {formatExpenseDate(expense.date)}
      </span>

      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-card-action
          className="shrink-0 text-zinc-400 hover:text-destructive"
          aria-label="Удалить расход"
          disabled={isDeleting}
          isLoading={isDeleting}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 />
        </Button>
      ) : null}
    </div>
  )
}
