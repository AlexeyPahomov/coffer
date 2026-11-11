import { useMemo } from 'react'

import { Button, DateRangePicker, Input, MoneyInput } from '@/shared/ui'
import type { Category } from '@/entities/category/model/types'
import { CategorySelect } from '@/entities/category/ui/CategorySelect'
import { formLabelClassName } from '@/shared/config/formUi'
import { bindMoneyAmountField } from '@/shared/lib/moneyInput'

import { createPlannedExpenseInputChangeHandler } from '../lib/plannedExpenseFormFieldHandlers'
import { resolvePlannedExpenseSavingsAmountError } from '../lib/plannedExpenseFormValues'
import { PlannedExpenseFundsHint } from './PlannedExpenseFundsHint'
import { PlannedExpenseIconPicker } from './PlannedExpenseIconPicker'
import type {
  CreatePlannedExpenseFormValues,
  ResolvePlannedExpenseAvailableFunds,
} from '../model/types'

export type CreatePlannedExpenseFieldsProps = {
  values: CreatePlannedExpenseFormValues
  categories: readonly Category[]
  /** Конверты накоплений — источник доли «из накоплений». */
  savingsCategories?: readonly Category[]
  resolveAvailableFunds?: ResolvePlannedExpenseAvailableFunds
  /** Редактируемый план — не учитывается в доступных средствах. */
  editingPlanId?: string | null
  onChange: (name: keyof CreatePlannedExpenseFormValues, value: string) => void
  patchValues: (patch: Partial<CreatePlannedExpenseFormValues>) => void
  onSubmit: () => void
  isPending: boolean
  isSubmitDisabled?: boolean
  submitLabel?: string
}

export function CreatePlannedExpenseFields({
  values,
  categories,
  savingsCategories = [],
  resolveAvailableFunds,
  editingPlanId = null,
  onChange,
  patchValues,
  onSubmit,
  isPending,
  isSubmitDisabled = false,
  submitLabel = 'Добавить план',
}: CreatePlannedExpenseFieldsProps) {
  const onFieldChange = createPlannedExpenseInputChangeHandler(onChange)
  const noCategories = categories.length === 0
  const planPeriodMonth = values.planned_date.slice(0, 7)
  // Пересчёт прогноза — только при смене месяца, не на каждый ввод.
  const availableFunds = useMemo(
    () =>
      planPeriodMonth
        ? (resolveAvailableFunds?.(planPeriodMonth, editingPlanId) ?? null)
        : null,
    [editingPlanId, planPeriodMonth, resolveAvailableFunds],
  )
  const savingsAmountError = resolvePlannedExpenseSavingsAmountError(values)

  return (
    <>
      <PlannedExpenseIconPicker
        iconName={values.icon_name}
        iconColor={values.icon_color}
        disabled={isPending}
        onIconChange={(icon_name) => onChange('icon_name', icon_name)}
        onColorChange={(icon_color) => onChange('icon_color', icon_color)}
      />
      <Input
        name="title"
        placeholder="Название (поездка, страховка…)"
        value={values.title}
        onChange={onFieldChange}
      />
      <textarea
        name="description"
        placeholder="Описание (необязательно)"
        className="min-h-14 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:min-h-8 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-none"
        value={values.description}
        rows={2}
        disabled={isPending}
        onChange={onFieldChange}
      />
      <MoneyInput
        name="amount"
        placeholder="Сумма"
        {...bindMoneyAmountField(values.amount, (amount) =>
          onChange('amount', amount),
        )}
      />
      <div className="space-y-2">
        <label
          htmlFor="planned-expense-category"
          className={formLabelClassName}
        >
          Источник
        </label>
        <CategorySelect
          id="planned-expense-category"
          value={values.category_id}
          onValueChange={(value) => onChange('category_id', value)}
          categories={categories}
          optional
          optionalLabel="Свободный пул"
          placeholder={
            noCategories
              ? 'Нет категорий расходов'
              : 'Свободный пул'
          }
          disabled={isPending}
        />
        <p className="text-xs text-zinc-500">
          Без категории план списывается из свободного пула. С категорией — из
          конверта при проведении, если в нём есть лимит.
        </p>
      </div>
      {savingsCategories.length > 0 ? (
        <div className="space-y-2">
          <label
            htmlFor="planned-expense-savings-category"
            className={formLabelClassName}
          >
            Добавить из накоплений
          </label>
          <CategorySelect
            id="planned-expense-savings-category"
            value={values.savings_category_id}
            onValueChange={(value) => onChange('savings_category_id', value)}
            categories={savingsCategories}
            optional
            optionalLabel="Не добавлять"
            placeholder="Не добавлять"
            disabled={isPending}
          />
          {values.savings_category_id ? (
            <MoneyInput
              name="savings_amount"
              placeholder="Сколько из накоплений"
              {...bindMoneyAmountField(values.savings_amount, (amount) =>
                onChange('savings_amount', amount),
              )}
            />
          ) : null}
          {savingsAmountError ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {savingsAmountError}
            </p>
          ) : null}
        </div>
      ) : null}
      <DateRangePicker
        emptyLabel="Когда?"
        from={values.planned_date}
        to={values.planned_date_end}
        onChange={(from, to) =>
          patchValues({ planned_date: from, planned_date_end: to })
        }
        disabled={isPending}
      />
      {availableFunds ? (
        <PlannedExpenseFundsHint
          values={values}
          periodMonth={planPeriodMonth}
          funds={availableFunds}
          hasSeveralSavingsEnvelopes={savingsCategories.length > 1}
        />
      ) : null}
      <Button
        type="button"
        variant="default"
        size="lg"
        className="w-full"
        isLoading={isPending}
        disabled={isSubmitDisabled}
        onClick={() => void onSubmit()}
      >
        {submitLabel}
      </Button>
    </>
  )
}
