import { useMemo, useState } from 'react'

import { useCreateIncomeMutation } from '@/entities/income/api/useCreateIncomeMutation'
import { copyIncomesFromPreviousMonth } from '@/entities/income/lib/copyIncomesFromPreviousMonth'
import type { Income } from '@/entities/income/model/types'
import { DEV_USER_ID } from '@/shared/lib/constants'

/** Создаёт в выбранном месяце ожидаемые доходы по образцу предыдущего. */
export function useCopyPreviousMonthIncomes(
  incomes: readonly Income[],
  periodMonth: string,
) {
  const createMutation = useCreateIncomeMutation()
  const [isCopying, setIsCopying] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const copies = useMemo(
    () => copyIncomesFromPreviousMonth(incomes, periodMonth),
    [incomes, periodMonth],
  )

  const copy = async () => {
    setIsCopying(true)
    setError(null)
    try {
      // По одной: у API нет пакетного создания, а порядок записей сохраняется.
      for (const payload of copies) {
        await createMutation.mutateAsync({ user_id: DEV_USER_ID, ...payload })
      }
    } catch (copyError) {
      setError(copyError)
    } finally {
      setIsCopying(false)
    }
  }

  return { count: copies.length, copy, isCopying, error }
}
