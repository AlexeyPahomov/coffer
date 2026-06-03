import type { Category } from '@/entities/category/model/types'
import { CategorySelect } from '@/entities/category/ui/CategorySelect'
import type { PlannedExpense } from '@/entities/planned-expense/model/types'
import { formLabelClassName } from '@/shared/config/formUi'
import { bindMoneyAmountField } from '@/shared/lib/moneyInput'
import { Button, DatePicker, Input, MoneyInput } from '@/shared/ui'

import {
  finishPlannedExpenseSubmitLabel,
  formatFinishPlannedExpenseReserveSummary,
} from '../lib/finishPlannedExpenseDialogCopy'
import type { useFinishPlannedExpenseForm } from '../model/useFinishPlannedExpenseForm'

export type FinishPlannedExpenseFieldsProps = {
  item: PlannedExpense
  categories: Category[]
  form: ReturnType<typeof useFinishPlannedExpenseForm>
}

export function FinishPlannedExpenseFields({
  item,
  categories,
  form,
}: FinishPlannedExpenseFieldsProps) {
  const reserveSummary = formatFinishPlannedExpenseReserveSummary(item)
  const noCategories = categories.length === 0

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-zinc-900">{item.title}</p>
      {reserveSummary ? (
        <p className="text-sm text-zinc-500">{reserveSummary}</p>
      ) : null}
      <div className="space-y-2">
        <label
          htmlFor="finish-planned-expense-category"
          className={formLabelClassName}
        >
          Категория
        </label>
        <CategorySelect
          id="finish-planned-expense-category"
          value={form.values.category_id}
          onValueChange={(value) => form.handleChange('category_id', value)}
          categories={categories}
          placeholder={
            noCategories ? 'Нет категорий расходов' : 'Выберите категорию'
          }
          disabled={form.isPending || noCategories}
        />
      </div>
      <MoneyInput
        name="amount"
        label="Итоговая сумма"
        placeholder="Сумма"
        disabled={form.isPending}
        {...bindMoneyAmountField(form.values.amount, (amount) =>
          form.handleChange('amount', amount),
        )}
      />
      <DatePicker
        label="Дата"
        value={form.values.date}
        disabled={form.isPending}
        onChange={(value) => form.handleChange('date', value)}
      />
      <Input
        name="description"
        label="Описание"
        placeholder="Комментарий (необязательно)"
        value={form.values.description}
        disabled={form.isPending}
        onChange={(event) =>
          form.handleChange('description', event.target.value)
        }
      />
      {form.validationError ? (
        <p className="text-sm text-destructive">{form.validationError}</p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={form.isPending}
        disabled={categories.length === 0}
        onClick={() => void form.submit()}
      >
        {finishPlannedExpenseSubmitLabel}
      </Button>
    </div>
  )
}
