import { useEffect, useState } from 'react'

import type { Income } from '@/entities/income/model/types'
import { useCreateIncomeMutation } from '@/entities/income/api/useCreateIncomeMutation'
import { useUpdateIncomeMutation } from '@/entities/income/api/useUpdateIncomeMutation'
import { isReceivedIncome } from '@/entities/income/lib/incomeStatus'
import { DEV_USER_ID } from '@/shared/lib/constants'
import { getErrorMessage } from '@/shared/lib/errors'
import { useForm } from '@/shared/lib/hooks/useForm'

import {
  emptyIncomeFormValues,
  resolveIncomeFormValues,
} from '../lib/incomeFormValues'

import type { IncomeFormValues } from './types'
import { validateIncomeForm } from './validation'

type UseIncomeFormParams = {
  editingIncome?: Income | null
  onComplete?: () => void
  /** Доход перешёл в статус «Получен» этим сохранением (create-as-RECEIVED
   *  или edit EXPECTED→RECEIVED) — повод предложить правила распределения. */
  onReceived?: (income: Income) => void
}

export function useIncomeForm({
  editingIncome = null,
  onComplete,
  onReceived,
}: UseIncomeFormParams = {}) {
  const isEditing = editingIncome != null
  const editingIncomeId = editingIncome?.id ?? null

  const createMutation = useCreateIncomeMutation()
  const updateMutation = useUpdateIncomeMutation()

  const { values, handleChange, patchValues, setValues } =
    useForm<IncomeFormValues>(resolveIncomeFormValues(editingIncome))

  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setValues(resolveIncomeFormValues(editingIncome))
    setValidationError(null)
  }, [editingIncomeId, setValues])

  const submitting = createMutation.isPending || updateMutation.isPending
  const activeMutation = isEditing ? updateMutation : createMutation

  async function submit() {
    setValidationError(null)
    createMutation.reset()
    updateMutation.reset()

    const result = validateIncomeForm(values)
    if (result.ok === false) {
      setValidationError(result.error)
      return
    }

    try {
      const wasReceived =
        isEditing && editingIncome ? isReceivedIncome(editingIncome) : false
      let saved: Income
      if (isEditing && editingIncome) {
        saved = await updateMutation.mutateAsync({
          id: editingIncome.id,
          payload: {
            user_id: DEV_USER_ID,
            ...result.payload,
          },
        })
      } else {
        saved = await createMutation.mutateAsync({
          user_id: DEV_USER_ID,
          ...result.payload,
        })
        setValues(emptyIncomeFormValues())
      }
      onComplete?.()
      if (!wasReceived && isReceivedIncome(saved)) {
        onReceived?.(saved)
      }
    } catch {
      // ошибка уже в mutation.error
    }
  }

  const serverError = activeMutation.isError
    ? getErrorMessage(
        activeMutation.error,
        isEditing ? 'Не удалось обновить доход' : 'Не удалось сохранить доход',
      )
    : null

  return {
    values,
    handleChange,
    patchValues,
    validationError,
    serverError,
    submitting,
    submit,
    isEditing,
  }
}

export type IncomeFormController = ReturnType<typeof useIncomeForm>
