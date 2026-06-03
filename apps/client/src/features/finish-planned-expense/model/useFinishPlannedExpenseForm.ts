import { useCallback, useEffect, useState } from 'react'

import { useFinishPlannedExpenseMutation } from '@/entities/planned-expense/api/useFinishPlannedExpenseMutation'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { getErrorMessage } from '@/shared/lib/errors'

import {
  emptyFinishPlannedExpenseFormValues,
  resolveFinishPlannedExpenseFormValues,
  type FinishPlannedExpenseFormValues,
} from '../lib/finishPlannedExpenseFormValues'
import { parseFinishPlannedExpenseForm } from './validation'

type UseFinishPlannedExpenseFormParams = {
  item: PlannedExpense | null
  onSuccess?: () => void
}

export function useFinishPlannedExpenseForm({
  item,
  onSuccess,
}: UseFinishPlannedExpenseFormParams) {
  const [values, setValues] = useState<FinishPlannedExpenseFormValues>(
    emptyFinishPlannedExpenseFormValues,
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const mutation = useFinishPlannedExpenseMutation()
  const itemId = item?.id ?? null

  useEffect(() => {
    if (item) {
      setValues(resolveFinishPlannedExpenseFormValues(item))
      setValidationError(null)
    }
  }, [itemId, item])

  const handleChange = useCallback(
    (name: keyof FinishPlannedExpenseFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }))
      setValidationError(null)
    },
    [],
  )

  const submit = useCallback(async () => {
    if (!item) {
      return
    }

    const parsed = parseFinishPlannedExpenseForm(values)
    if ('error' in parsed) {
      setValidationError(parsed.error)
      return
    }

    try {
      await mutation.mutateAsync({ id: item.id, ...parsed.payload })
      onSuccess?.()
    } catch (error) {
      setValidationError(getErrorMessage(error, 'Не удалось провести расход'))
    }
  }, [item, mutation, onSuccess, values])

  return {
    values,
    handleChange,
    submit,
    isPending: mutation.isPending,
    validationError,
  }
}
