import { parseMoneyInput } from '@coffer/shared'
import { useEffect, useState } from 'react'

import { useCreatePlannedEventMutation } from '@/entities/planned-event/api/useCreatePlannedEventMutation'
import { NEW_PLANNED_EVENT_VALUE } from '@/entities/planned-event/lib/plannedEventSelectValue'
import { useCreatePlannedExpenseMutation } from '@/entities/planned-expense/api/useCreatePlannedExpenseMutation'
import { useUpdatePlannedExpenseMutation } from '@/entities/planned-expense/api/useUpdatePlannedExpenseMutation'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import type { UpdatePlannedExpensePayload } from '@/entities/planned-expense/model/types'

import {
  buildPlannedExpenseDatePayload,
  buildPlannedExpenseDateUpdatePatch,
  emptyPlannedExpenseFormValues,
  parsePlannedExpenseSavingsAmount,
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
  const createEventMutation = useCreatePlannedEventMutation()
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
  const parsedSavingsAmount = parsePlannedExpenseSavingsAmount(
    values,
    parsedAmount,
  )
  const isNewEvent = values.event_id === NEW_PLANNED_EVENT_VALUE
  const isPending = activeMutation.isPending || createEventMutation.isPending
  const isSubmitDisabled =
    isPending ||
    (isNewEvent && !values.new_event_title.trim()) ||
    !values.title.trim() ||
    parsedAmount === null ||
    parsedSavingsAmount === null ||
    !values.planned_date.trim()

  const submit = async () => {
    createEventMutation.reset()
    const amount = parseMoneyInput(values.amount)
    const savingsAmount = parsePlannedExpenseSavingsAmount(values, amount)
    if (
      !values.title.trim() ||
      amount === null ||
      savingsAmount === null ||
      !values.planned_date.trim()
    ) {
      return
    }
    if (isNewEvent && !values.new_event_title.trim()) {
      return
    }
    let eventId = values.event_id
    if (isNewEvent) {
      // Новое событие наследует иконку плана — поправить можно в сводке.
      eventId = (
        await createEventMutation.mutateAsync({
          title: values.new_event_title.trim(),
          icon_name: values.icon_name,
          icon_color: values.icon_color,
        })
      ).id
      // Если план не сохранится, повторная отправка не создаст дубль события.
      patchValues({ event_id: eventId, new_event_title: '' })
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
        savings_category_id: values.savings_category_id || null,
        savings_amount: savingsAmount,
        event_id: eventId || null,
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
        savings_category_id: values.savings_category_id || undefined,
        savings_amount: savingsAmount,
        event_id: eventId || undefined,
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
    isPending,
    isSubmitDisabled,
    error: activeMutation.error ?? createEventMutation.error,
    isEditing,
  }
}
