import { type MouseEvent } from 'react'

import { Undo2 } from 'lucide-react'

import { useCreateTransferMutation } from '@/entities/transfer'
import { formatAmount } from '@/shared/lib/format'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui'

import type { ReturnToSavingsHint } from '../lib/returnToSavingsHint'

type ReturnToSavingsButtonProps = {
  /** Конверт-источник остатка. */
  fromCategoryId: string
  hint: ReturnToSavingsHint
  /** Учётный месяц периода, "YYYY-MM". */
  periodMonth: string
}

/**
 * Обратная операция к «покрыть из накоплений»: возвращает остаток конверта в
 * накопления одним переводом конверт→накопления. Ненавязчивая ghost-иконка с
 * тултипом — «глупая» кнопка, решение о показе принимает вызывающий через
 * {@link buildReturnToSavingsHint}.
 */
export function ReturnToSavingsButton({
  fromCategoryId,
  hint,
  periodMonth,
}: ReturnToSavingsButtonProps) {
  const mutation = useCreateTransferMutation()

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation() // карточка кликабельна для выбора конверта
    mutation.mutate({
      from_category_id: fromCategoryId,
      to_category_id: hint.savingsCategoryId,
      amount: hint.amount,
      period_month: `${periodMonth.slice(0, 7)}-01`,
    })
  }

  const label = `Вернуть в «${hint.savingsName}»: ${formatAmount(hint.amount)}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          isLoading={mutation.isPending}
          aria-label={label}
          onClick={handleClick}
        >
          <Undo2 aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
