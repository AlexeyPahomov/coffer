import { parseMoneyInput } from '@coffer/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { pickIncomeForTopUp } from '@/entities/allocation/lib/pickIncomeForTopUp'
import { useCreateAllocationMutation } from '@/entities/allocation/api/useCreateAllocationMutation'
import type { Allocation } from '@/entities/allocation/model/types'
import type { CategoryBudgetSnapshot } from '@/entities/budget'
import { useCreateTransferMutation } from '@/entities/transfer'
import { useCreateExpenseMutation } from '@/entities/expense/api/useCreateExpenseMutation'
import { useUpdateExpenseMutation } from '@/entities/expense/api/useUpdateExpenseMutation'
import type { Expense } from '@/entities/expense/model/types'
import type { Income } from '@/entities/income/model/types'
import { DEV_USER_ID } from '@/shared/lib/constants'
import { getErrorMessage } from '@/shared/lib/errors'

import { resolveCreateExpenseFormValues } from '../lib/expenseFormValues'
import { buildSavingsTransferHint } from '../lib/savingsTransferHint'
import { budgetPreviewStressKey } from '../lib/stressCategoryId'

import { QUICK_TOP_UP_CHECK_AMOUNT } from './constants'
import { computeExpenseBudgetPreview } from './budget'
import type { CreateExpenseFormValues } from './types'
import { validateCreateExpenseForm } from './validation'

type UseCreateExpenseFormParams = {
  budgets: CategoryBudgetSnapshot[]
  incomes: Income[]
  allocations: Allocation[]
  /** Свободный пул периода (до этой траты) — для подсказки «покрыть из накоплений». */
  freePoolAvailable: number
  editingExpense?: Expense | null
  onComplete?: () => void
  onStressCategoryChange?: (categoryId: string | null) => void
}

export function useCreateExpenseForm({
  budgets,
  incomes,
  allocations,
  freePoolAvailable,
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
  const transferMutation = useCreateTransferMutation()

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

  const savingsTransfer = useMemo(() => {
    const replaced =
      editingExpense != null &&
      budgetPreview?.categoryId === editingExpense.category_id
        ? editingExpense.amount
        : 0
    const freePoolAfter =
      freePoolAvailable + replaced - (budgetPreview?.amount ?? 0)
    return buildSavingsTransferHint(budgets, budgetPreview, freePoolAfter)
  }, [budgets, budgetPreview, editingExpense, freePoolAvailable])

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

  /** Записать расход (create/update). Бросает при ошибке мутации. */
  const submitExpense = useCallback(async () => {
    const amount = parseMoneyInput(values.amount)!
    const payload = {
      category_id: values.category_id,
      amount,
      description: values.description.trim() || undefined,
      date: values.date,
    }

    if (isEditing && editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense.id, payload })
    } else {
      await createMutation.mutateAsync({ user_id: DEV_USER_ID, ...payload })
    }
  }, [createMutation, editingExpense, isEditing, updateMutation, values])

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

    try {
      await submitExpense()
      onComplete?.()
      setValues(resolveCreateExpenseFormValues(null))
    } catch {
      // mutation.error handles UI state
    }
  }, [createMutation, onComplete, submitExpense, updateMutation, values])

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

  /**
   * Записать расход И тут же покрыть его перерасход переводом из накоплений —
   * единое действие (иначе деньги бы переехали под несуществующую трату).
   * Порядок: сначала расход (факт траты), затем покрытие на ровно перерасход.
   */
  const handleCoverFromSavings = useCallback(async () => {
    setValidationError(null)
    setTopUpError(null)
    createMutation.reset()
    updateMutation.reset()
    transferMutation.reset()

    const transfer = savingsTransfer
    if (!transfer) {
      return
    }

    const error = validateCreateExpenseForm(values)
    if (error) {
      setValidationError(error)
      return
    }

    try {
      await submitExpense()
      await transferMutation.mutateAsync({
        from_category_id: transfer.savingsCategoryId,
        // null-получатель (списание в пул) → поле опускается в payload.
        to_category_id: transfer.toCategoryId ?? undefined,
        amount: transfer.shortfall,
        period_month: `${values.date.slice(0, 7)}-01`,
      })
      onComplete?.()
      setValues(resolveCreateExpenseFormValues(null))
    } catch (err) {
      // Расход мог записаться, а перевод — нет: форму не сбрасываем, чтобы было
      // видно состояние; serverError покажет проблему с расходом, topUpError — с покрытием.
      setTopUpError(getErrorMessage(err, 'Не удалось покрыть из накоплений'))
    }
  }, [
    createMutation,
    onComplete,
    savingsTransfer,
    submitExpense,
    transferMutation,
    updateMutation,
    values,
  ])

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
    allocationMutation.isPending ||
    transferMutation.isPending

  return {
    values,
    validationError,
    budgetPreview,
    savingsTransfer,
    topUpError,
    canQuickTopUp,
    serverError,
    isBusy,
    isEditing,
    isRecording: createMutation.isPending || updateMutation.isPending,
    isTopUpPending: allocationMutation.isPending,
    isCoverPending: transferMutation.isPending,
    handleChange,
    handleSubmit,
    handleQuickTopUp,
    handleCoverFromSavings,
  }
}
