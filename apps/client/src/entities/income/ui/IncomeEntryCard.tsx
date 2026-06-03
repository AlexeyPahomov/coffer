import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'

import type { Income } from '@/entities/income/model/types'
import {
  categoryCardPressableClassName,
  categoryCardPressingClassName,
} from '@/entities/category/lib/categoryTileLayout'
import { getIncomeTypeUi } from '@/entities/income/lib/incomeTypeUi'
import { resolveIncomeType } from '@coffer/shared'
import { formatAmount, formatDateLabel } from '@/shared/lib/format'
import { useCardActivate } from '@/shared/hooks/use-card-activate'
import { useLongPress } from '@/shared/hooks/use-long-press'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui'

type IncomeEntryCardProps = {
  income: Income
  onEdit?: (income: Income) => void
  onDelete: () => void
  isDeleting?: boolean
}

export function IncomeEntryCard({
  income,
  onEdit,
  onDelete,
  isDeleting = false,
}: IncomeEntryCardProps) {
  const incomeType = resolveIncomeType(income.income_type)
  const typeUi = getIncomeTypeUi(incomeType)
  const title = income.source?.trim() || typeUi.label
  const { Icon } = typeUi

  const handleEdit = useCallback(() => {
    onEdit?.(income)
  }, [income, onEdit])

  const isEditable = onEdit != null

  const { isPressing, longPressHandlers } = useLongPress({
    onLongPress: handleEdit,
    disabled: !isEditable,
  })

  const activateProps = useCardActivate(handleEdit, {
    contextMenu: isEditable,
    ariaLabel: isEditable
      ? `${title}, ${formatAmount(income.amount)}`
      : undefined,
  })

  return (
    <article
      className={cn(
        'flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 shadow-sm ring-1 ring-transparent transition-[box-shadow,transform,background-color]',
        isEditable && categoryCardPressableClassName,
        isEditable && 'cursor-pointer hover:shadow-md',
        isPressing && categoryCardPressingClassName,
      )}
      {...(isEditable ? activateProps : {})}
      {...(isEditable ? longPressHandlers : {})}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5',
          typeUi.avatarClassName,
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
        <p className="truncate text-xs text-zinc-500">{typeUi.subtitle}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <p className="text-base font-bold tabular-nums text-zinc-900">
          {formatAmount(income.amount)}
        </p>
        <p className="text-[11px] tabular-nums text-zinc-500">
          {formatDateLabel(income.period_month)}
        </p>
      </div>

      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          data-card-action
          className="shrink-0 text-zinc-400 hover:text-destructive"
          aria-label="Удалить доход"
          disabled={isDeleting}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 />
        </Button>
      ) : null}
    </article>
  )
}
