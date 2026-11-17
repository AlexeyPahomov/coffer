import { Wallet } from 'lucide-react'
import { useMemo } from 'react'

import {
  Button,
  Checkbox,
  DateRangePicker,
  InfoHint,
  Input,
  MoneyInput,
} from '@/shared/ui'
import type { Category } from '@/entities/category/model/types'
import { CategorySelect } from '@/entities/category/ui/CategorySelect'
import { usePlannedEventsQuery } from '@/entities/planned-event/api/usePlannedEventsQuery'
import { NEW_PLANNED_EVENT_VALUE } from '@/entities/planned-event/lib/plannedEventSelectValue'
import { PlannedEventSelect } from '@/entities/planned-event/ui/PlannedEventSelect'
import { formLabelClassName } from '@/shared/config/formUi'
import { bindMoneyAmountField } from '@/shared/lib/moneyInput'
import { cn } from '@/shared/lib/utils'

import { createPlannedExpenseInputChangeHandler } from '../lib/plannedExpenseFormFieldHandlers'
import { resolvePlannedExpenseSavingsAmountError } from '../lib/plannedExpenseFormValues'
import { PlannedExpenseFundsHint } from './PlannedExpenseFundsHint'
import { PlannedExpenseIconPicker } from '@/entities/planned-expense/ui/PlannedExpenseIconPicker'
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
  const isFromSavings = Boolean(values.savings_category_id)
  const eventsQuery = usePlannedEventsQuery()
  const isNewEvent = values.event_id === NEW_PLANNED_EVENT_VALUE

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
      <DateRangePicker
        emptyLabel="Когда?"
        from={values.planned_date}
        to={values.planned_date_end}
        onChange={(from, to) =>
          patchValues({ planned_date: from, planned_date_end: to })
        }
        disabled={isPending}
      />
      <div className="space-y-2">
        <div className="flex items-start gap-1">
          <label htmlFor="planned-expense-event" className={formLabelClassName}>
            Событие
          </label>
          <InfoHint label="Событие">
            Объединяет планы одной поездки или праздника: билеты, жильё,
            аренду. В сводке событие показывается одной суммой.
          </InfoHint>
        </div>
        <PlannedEventSelect
          id="planned-expense-event"
          value={values.event_id}
          onValueChange={(value) => onChange('event_id', value)}
          events={eventsQuery.data ?? []}
          disabled={isPending}
        />
        {isNewEvent ? (
          <Input
            name="new_event_title"
            placeholder="Название события (Греция, майские…)"
            value={values.new_event_title}
            disabled={isPending}
            onChange={onFieldChange}
          />
        ) : null}
      </div>
      <MoneyInput
        name="amount"
        placeholder="Сумма"
        {...bindMoneyAmountField(values.amount, (amount) =>
          onChange('amount', amount),
        )}
      />
      <div className="space-y-2">
        <div className="flex items-start gap-1">
          <label
            htmlFor="planned-expense-category"
            className={formLabelClassName}
          >
            Источник
          </label>
          <InfoHint label="Источник">
            Без категории план списывается из свободного пула. С категорией — из
            конверта при проведении, если в нём есть лимит.
          </InfoHint>
        </div>
        <CategorySelect
          id="planned-expense-category"
          value={values.category_id}
          onValueChange={(value) => onChange('category_id', value)}
          categories={categories}
          optional
          optionalLabel="Свободный пул"
          optionalIcon={
            <Wallet
              className="size-4 shrink-0 text-teal"
              strokeWidth={2}
              aria-hidden
            />
          }
          placeholder={
            noCategories
              ? 'Нет категорий расходов'
              : 'Свободный пул'
          }
          disabled={isPending}
        />
      </div>
      {savingsCategories.length > 0 ? (
        <div>
          <label className="flex items-start gap-2 text-sm font-medium text-zinc-800">
            <Checkbox
              id="planned-expense-from-savings"
              className="mt-0.5"
              checked={isFromSavings}
              disabled={isPending}
              onCheckedChange={(checked) =>
                onChange(
                  'savings_category_id',
                  checked === true ? savingsCategories[0].id : '',
                )
              }
            />
            Добавить из накоплений
          </label>
          <div
            className={cn(
              'coffer-collapse grid',
              isFromSavings
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0',
            )}
            inert={!isFromSavings}
          >
            {/* -m-1 p-1: не обрезать focus-ring инпута */}
            <div className="-m-1 min-h-0 overflow-hidden p-1">
              <div className="space-y-2 pt-2">
                <MoneyInput
                  name="savings_amount"
                  placeholder="Сколько из накоплений"
                  {...bindMoneyAmountField(values.savings_amount, (amount) =>
                    onChange('savings_amount', amount),
                  )}
                />
                {savingsAmountError ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {savingsAmountError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
