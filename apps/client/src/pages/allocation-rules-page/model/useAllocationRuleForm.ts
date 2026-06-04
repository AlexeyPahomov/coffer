import { useEffect, useState } from 'react'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import { useCreateAllocationRuleMutation } from '@/entities/allocation-rule/api/useCreateAllocationRuleMutation'
import { useUpdateAllocationRuleMutation } from '@/entities/allocation-rule/api/useUpdateAllocationRuleMutation'
import type { Category } from '@/entities/category/model/types'
import { getErrorMessage } from '@/shared/lib/errors'

import {
  createAllocationRuleLineFormValues,
  emptyAllocationRuleFormValues,
  resolveAllocationRuleFormValues,
  validateAllocationRuleForm,
  type AllocationRuleFormValues,
  type AllocationRuleLineFormValues,
} from './allocationRuleForm'

type UseAllocationRuleFormParams = {
  categories: readonly Category[]
  editingRule?: AllocationRule | null
  onComplete?: () => void
}

export function useAllocationRuleForm({
  categories,
  editingRule = null,
  onComplete,
}: UseAllocationRuleFormParams) {
  const isEditing = editingRule != null
  const editingRuleId = editingRule?.id ?? null
  const createMutation = useCreateAllocationRuleMutation()
  const updateMutation = useUpdateAllocationRuleMutation()
  const [values, setValues] = useState<AllocationRuleFormValues>(() =>
    resolveAllocationRuleFormValues(editingRule, categories),
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setValues(resolveAllocationRuleFormValues(editingRule, categories))
    setValidationError(null)
  }, [categories, editingRuleId])

  const submitting = createMutation.isPending || updateMutation.isPending
  const activeMutation = isEditing ? updateMutation : createMutation

  function patchValues(patch: Partial<AllocationRuleFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function patchLine(id: string, patch: Partial<AllocationRuleLineFormValues>) {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      ),
    }))
  }

  function addLine() {
    const line = createAllocationRuleLineFormValues(categories[0]?.id ?? '')
    setValues((prev) => ({ ...prev, lines: [...prev.lines, line] }))
  }

  function removeLine(id: string) {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== id),
    }))
  }

  async function submit() {
    setValidationError(null)
    createMutation.reset()
    updateMutation.reset()

    let result: ReturnType<typeof validateAllocationRuleForm>
    try {
      result = validateAllocationRuleForm(values)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Ошибка формы')
      return
    }

    if (!result.ok) {
      setValidationError(result.error)
      return
    }

    try {
      if (isEditing && editingRule) {
        await updateMutation.mutateAsync({
          id: editingRule.id,
          payload: result.payload,
        })
      } else {
        await createMutation.mutateAsync(result.payload)
        setValues(emptyAllocationRuleFormValues(categories))
      }
      onComplete?.()
    } catch {
      // ошибка уже в mutation.error
    }
  }

  const serverError = activeMutation.isError
    ? getErrorMessage(
        activeMutation.error,
        isEditing
          ? 'Не удалось обновить правило'
          : 'Не удалось сохранить правило',
      )
    : null

  return {
    values,
    patchValues,
    patchLine,
    addLine,
    removeLine,
    validationError,
    serverError,
    submitting,
    submit,
    isEditing,
  }
}

export type AllocationRuleFormController = ReturnType<
  typeof useAllocationRuleForm
>
