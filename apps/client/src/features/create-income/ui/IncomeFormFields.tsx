import { bindMoneyAmountField } from '@/shared/lib/moneyInput'
import { cn } from '@/shared/lib/utils'
import { Button, Input, MoneyInput } from '@/shared/ui'

import { incomeFormSubmitLabel } from '../lib/incomeFormDialogCopy'
import {
  incomeFormActionsClassName,
  incomeFormCancelButtonClassName,
  incomeFormFieldClassName,
  incomeFormPrimaryButtonClassName,
} from '../lib/incomeFormLayout'
import type { IncomeFormController } from '../model/useIncomeForm'

import { IncomeFormDatePicker } from './IncomeFormDatePicker'
import { IncomeFormStatusSelect } from './IncomeFormStatusSelect'
import { IncomeFormTypeSelect } from './IncomeFormTypeSelect'

export type IncomeFormFieldsProps = {
  form: IncomeFormController
  stackActions?: boolean
  onCancel?: () => void
}

export function IncomeFormFields({
  form,
  stackActions = false,
  onCancel,
}: IncomeFormFieldsProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.submit()
      }}
    >
      <MoneyInput
        id="income-amount"
        name="amount"
        placeholder="Сумма"
        className={cn(incomeFormFieldClassName, 'font-bold tabular-nums')}
        disabled={form.submitting}
        {...bindMoneyAmountField(form.values.amount, (amount) =>
          form.patchValues({ amount }),
        )}
      />

      <IncomeFormTypeSelect
        value={form.values.income_type}
        onChange={(income_type) =>
          form.patchValues({ income_type })
        }
        disabled={form.submitting}
      />

      <IncomeFormStatusSelect
        value={form.values.status}
        onChange={(status) => form.patchValues({ status })}
        disabled={form.submitting}
      />

      <Input
        id="income-source"
        name="source"
        type="text"
        autoComplete="off"
        placeholder="Название — ООО Ромашка, Тинькофф…"
        className={incomeFormFieldClassName}
        value={form.values.source}
        onChange={form.handleChange}
        disabled={form.submitting}
      />

      <IncomeFormDatePicker
        id="income-date"
        value={form.values.period_month}
        onChange={(period_month) => form.patchValues({ period_month })}
        disabled={form.submitting}
      />

      {form.validationError ? (
        <p className="text-sm text-red-600">{form.validationError}</p>
      ) : null}
      {form.serverError ? (
        <p className="text-sm text-red-600">{form.serverError}</p>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          stackActions && incomeFormActionsClassName,
        )}
      >
        <Button
          type="submit"
          isLoading={form.submitting}
          size="lg"
          className={cn(
            'min-w-40',
            stackActions && incomeFormPrimaryButtonClassName,
          )}
        >
          {incomeFormSubmitLabel(form.isEditing)}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={form.submitting}
            className={
              stackActions ? incomeFormCancelButtonClassName : undefined
            }
            onClick={onCancel}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  )
}
