import { parseMoneyInput } from '@coffer/shared'
import { useEffect, useState } from 'react'

import { useCreatePlannedExpenseMutation } from '@/entities/planned-expense/api/useCreatePlannedExpenseMutation'
import { useUpdatePlannedExpenseMutation } from '@/entities/planned-expense/api/useUpdatePlannedExpenseMutation'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { UpdatePlannedExpensePayload } from '@/entities/planned-expense/model/types'

import {
  buildPlannedExpenseDatePayload,
  buildPlannedExpenseDateUpdatePatch,
  emptyPlannedExpenseFormValues,
  plannedExpenseToFormValues,
  resolvePlannedExpenseFormValues,
} from '../lib/plannedExpenseFormValues'

import type { CreatePlannedExpenseFormValues } from './types'

type UseCreatePlannedExpenseFormOptions = {
  editingPlannedExpense?: PlannedExpense | null
  onSuccess?: () => void
}

export function useCreatePlannedExpenseForm(
  options?: UseCreatePlannedExpenseFormOptions,
) {
  const editingPlannedExpense = options?.editingPlannedExpense ?? null
  const isEditing = editingPlannedExpense != null
  const editingId = editingPlannedExpense?.id ?? null

  const createMutation = useCreatePlannedExpenseMutation()
  const updateMutation = useUpdatePlannedExpenseMutation()
  const [values, setValues] = useState(() =>
    resolvePlannedExpenseFormValues(editingPlannedExpense),
  )

  useEffect(() => {
    setValues(resolvePlannedExpenseFormValues(editingPlannedExpense))
  }, [editingId, editingPlannedExpense])

  const patchValues = (patch: Partial<CreatePlannedExpenseFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const handleChange = (
    name: keyof CreatePlannedExpenseFormValues,
    value: string,
  ) => {
    patchValues({ [name]: value })
  }

  const reset = () => setValues(emptyPlannedExpenseFormValues())
  const activeMutation = isEditing ? updateMutation : createMutation

  const parsedAmount = parseMoneyInput(values.amount)
  const isSubmitDisabled =
    activeMutation.isPending ||
    !values.title.trim() ||
    parsedAmount === null ||
    !values.planned_date.trim()

  const submit = async () => {
    const amount = parseMoneyInput(values.amount)
    if (!values.title.trim() || amount === null || !values.planned_date.trim()) {
      return
    }
    const dateFields = buildPlannedExpenseDatePayload(
      values.planned_date,
      values.planned_date_end,
    )

    if (isEditing && editingPlannedExpense) {
      const payload: UpdatePlannedExpensePayload = {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        icon_name: values.icon_name,
        icon_color: values.icon_color,
        amount,
        category_id: values.category_id || null,
        ...buildPlannedExpenseDateUpdatePatch(
          dateFields.planned_date,
          values.planned_date_end,
          plannedExpenseToFormValues(editingPlannedExpense),
        ),
      }

      await updateMutation.mutateAsync({
        id: editingPlannedExpense.id,
        payload,
      })
    } else {
      await createMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        icon_name: values.icon_name,
        icon_color: values.icon_color,
        amount,
        category_id: values.category_id || undefined,
        ...dateFields,
      })
      reset()
    }

    options?.onSuccess?.()
  }

  return {
    values,
    handleChange,
    patchValues,
    submit,
    isPending: activeMutation.isPending,
    isSubmitDisabled,
    error: activeMutation.error,
    isEditing,
  }
}
