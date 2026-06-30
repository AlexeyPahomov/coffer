import { useMutation, useQueryClient } from '@tanstack/react-query'

import { invalidateDerivedBudgetCaches } from '@/entities/budget'
import { todayDateInputValue } from '@/shared/lib/date'

import type { CreateTransferPayload, Transfer } from '../model/types'
import { createTransfer } from './transferApi'

export function useCreateTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation<Transfer, Error, CreateTransferPayload>({
    mutationFn: createTransfer,
    onSuccess: (transfer) => {
      // Снапшоты и summary месяца уже обновлены проектором на сервере —
      // сбрасываем производные срезы, чтобы клиент перезапросил transfer-aware числа.
      invalidateDerivedBudgetCaches(queryClient, {
        periodMonth: transfer.period_month.slice(0, 7),
        asOf: todayDateInputValue(),
      })
    },
  })
}
