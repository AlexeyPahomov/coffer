import { parseMoneyInput } from '@coffer/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { pickIncomeForTopUp } from '@/entities/allocation/lib/pickIncomeForTopUp'
import { useCreateAllocationMutation } from '@/entities/allocation/api/useCreateAllocationMutation'
import type { Allocation } from '@/entities/allocation/model/types'
import type { CategoryBudgetSnapshot } from '@/entities/budget'
import { useCreateExpenseMutation } from '@/entities/expense/api/useCreateExpenseMutation'
import { useUpdateExpenseMutation } from '@/entities/expense/api/useUpdateExpenseMutation'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { DEV_USER_ID } from '@/shared/lib/constants'
import { getErrorMessage } from '@/shared/lib/errors'

import { resolveCreateExpenseFormValues } from '../lib/expenseFormValues'
import { budgetPreviewStressKey } from '../lib/stressCategoryId'

import { QUICK_TOP_UP_CHECK_AMOUNT } from './constants'
import { computeExpenseBudgetPreview } from './budget'
import type { CreateExpenseFormValues } from './types'
import { validateCreateExpenseForm } from './validation'

type UseCreateExpenseFormParams = {
  budgets: CategoryBudgetSnapshot[]
  incomes: Income[]
  allocations: Allocation[]
  editingExpense?: Expense | null
  onComplete?: () => void
  onStressCategoryChange?: (categoryId: string | null) => void
}

export function useCreateExpenseForm({
  budgets,
  incomes,
  allocations,
  editingExpense = null,
  onComplete,
  onStressCategoryChange,
}: UseCreateExpenseFormParams) {
  const [values, setValues] = useState(() =>
    resolveCreateExpenseFormValues(editingExpense),
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [topUpError, setTopUpError] = useState<string | null>(null)

  const createMutation = useCreateExpenseMutation()
  const updateMutation = useUpdateExpenseMutation()
  const allocationMutation = useCreateAllocationMutation()

  const isEditing = editingExpense != null

  const editingExpenseId = editingExpense?.id ?? null

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) {
        return
      }
      setValues(resolveCreateExpenseFormValues(editingExpense))
      setValidationError(null)
      setTopUpError(null)
    })

    return () => {
      cancelled = true
    }
  }, [editingExpenseId, editingExpense])

  const budgetByCategoryId = useMemo(
    () => new Map(budgets.map((b) => [b.categoryId, b])),
    [budgets],
  )

  const budgetPreview = useMemo(() => {
    if (!values.category_id) {
      return null
    }
    const budget = budgetByCategoryId.get(values.category_id)
    if (!budget) {
      return null
    }

    const replacedExpenseAmount =
      editingExpense != null &&
      values.category_id === editingExpense.category_id
        ? editingExpense.amount
        : undefined

    return computeExpenseBudgetPreview(budget, values.amount, {
      replacedExpenseAmount,
    })
  }, [
    values.category_id,
    values.amount,
    budgetByCategoryId,
    editingExpense,
  ])

  const onStressCategoryChangeRef = useRef(onStressCategoryChange)
  useEffect(() => {
    onStressCategoryChangeRef.current = onStressCategoryChange
  }, [onStressCategoryChange])

  const previewStressKey = budgetPreviewStressKey(budgetPreview)

  const budgetPreviewRef = useRef(budgetPreview)
  useEffect(() => {
    budgetPreviewRef.current = budgetPreview
  }, [budgetPreview])

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const preview = budgetPreviewRef.current
      const stressId = preview?.isOverBudget ? preview.categoryId : null
      onStressCategoryChangeRef.current?.(stressId)
    })
    return () => cancelAnimationFrame(frameId)
  }, [previewStressKey])

  const canQuickTopUp = useMemo(
    () =>
      pickIncomeForTopUp(incomes, allocations, QUICK_TOP_UP_CHECK_AMOUNT) !==
      null,
    [incomes, allocations],
  )

  const handleChange = useCallback(
    (name: keyof CreateExpenseFormValues, value: string) => {
      setTopUpError(null)
      setValues((prev) => {
        if (prev[name] === value) {
          return prev
        }
        return {
          ...prev,
          [name]: value,
        }
      })
    },
    [],
  )

  const handleSubmit = useCallback(async () => {
    setValidationError(null)
    setTopUpError(null)
    createMutation.reset()
    updateMutation.reset()

    const error = validateCreateExpenseForm(values)
    if (error) {
      setValidationError(error)
      return
    }

    const amount = parseMoneyInput(values.amount)!
    const payload = {
      category_id: values.category_id,
      amount,
      description: values.description.trim() || undefined,
      date: values.date,
    }

    try {
      if (isEditing && editingExpense) {
        await updateMutation.mutateAsync({
          id: editingExpense.id,
          payload,
        })
      } else {
        await createMutation.mutateAsync({
          user_id: DEV_USER_ID,
          ...payload,
        })
      }

      onComplete?.()

      setValues(resolveCreateExpenseFormValues(null))
    } catch {
      // mutation.error handles UI state
    }
  }, [
    createMutation,
    editingExpense,
    isEditing,
    onComplete,
    updateMutation,
    values,
  ])

  const handleQuickTopUp = useCallback(
    async (topUpAmount: number) => {
      setTopUpError(null)
      allocationMutation.reset()

      if (!values.category_id) {
        return
      }

      const income = pickIncomeForTopUp(incomes, allocations, topUpAmount)
      if (!income) {
        setTopUpError(
          'Недостаточно свободных средств. Получите доход или освободите деньги на странице распределения.',
        )
        return
      }

      try {
        await allocationMutation.mutateAsync({
          income_id: income.incomeId,
          category_id: values.category_id,
          amount: topUpAmount,
        })
      } catch (err) {
        setTopUpError(
          getErrorMessage(err, 'Не удалось пополнить конверт'),
        )
      }
    },
    [allocationMutation, allocations, incomes, values.category_id],
  )

  const activeMutation = isEditing ? updateMutation : createMutation

  const serverError = activeMutation.isError
    ? getErrorMessage(
        activeMutation.error,
        isEditing ? 'Не удалось сохранить изменения' : 'Не удалось сохранить расход',
      )
    : null

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    allocationMutation.isPending

  return {
    values,
    validationError,
    budgetPreview,
    topUpError,
    canQuickTopUp,
    serverError,
    isBusy,
    isEditing,
    isRecording: createMutation.isPending || updateMutation.isPending,
    isTopUpPending: allocationMutation.isPending,
    handleChange,
    handleSubmit,
    handleQuickTopUp,
  }
}
