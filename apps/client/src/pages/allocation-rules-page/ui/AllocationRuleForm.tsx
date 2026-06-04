import {
  INCOME_TYPES,
  INCOME_TYPE_LABELS,
} from '@coffer/shared'
import { Trash2 } from 'lucide-react'

import type { AllocationRule } from '@/entities/allocation-rule/model/types'
import type { Category } from '@/entities/category/model/types'
import { CategorySelect } from '@/entities/category/ui/CategorySelect'
import { bindMoneyAmountField } from '@/shared/lib/moneyInput'
import { cn } from '@/shared/lib/utils'
import {
  AddButton,
  Button,
  Checkbox,
  Input,
  MoneyInput,
  Select,
} from '@/shared/ui'

import { anyIncomeTypeValue } from '../model/allocationRuleForm'
import { useAllocationRuleForm } from '../model/useAllocationRuleForm'

type AllocationRuleFormProps = {
  categories: readonly Category[]
  editingRule?: AllocationRule | null
  onCancel?: () => void
  onComplete?: () => void
  stackActions?: boolean
}

const incomeTypeOptions = [
  { value: anyIncomeTypeValue(), label: 'Любой доход' },
  ...INCOME_TYPES.map((type) => ({
    value: type,
    label: INCOME_TYPE_LABELS[type],
  })),
]

export function AllocationRuleForm({
  categories,
  editingRule = null,
  onCancel,
  onComplete,
  stackActions = false,
}: AllocationRuleFormProps) {
  const form = useAllocationRuleForm({ categories, editingRule, onComplete })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.submit()
      }}
    >
      <Input
        id="allocation-rule-name"
        placeholder="Название правила — Зарплата 5 числа"
        value={form.values.name}
        disabled={form.submitting}
        onChange={(event) => form.patchValues({ name: event.target.value })}
      />

      <Select
        id="allocation-rule-trigger-income-type"
        value={form.values.trigger_income_type}
        onValueChange={(trigger_income_type) =>
          form.patchValues({ trigger_income_type })
        }
        options={incomeTypeOptions}
        placeholder="Тип дохода"
        disabled={form.submitting}
      />

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <Checkbox
          checked={form.values.is_active}
          disabled={form.submitting}
          onCheckedChange={(checked) =>
            form.patchValues({ is_active: checked === true })
          }
        />
        Правило активно
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-800">Строки правила</p>
          <AddButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={form.submitting || categories.length === 0}
            onClick={form.addLine}
          >
            Добавить строку
          </AddButton>
        </div>

        {form.values.lines.map((line, index) => (
          <div
            key={line.id}
            className="grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 md:grid-cols-[minmax(0,1fr)_7.5rem_auto] md:items-center"
          >
            <CategorySelect
              id={`allocation-rule-line-category-${line.id}`}
              value={line.category_id}
              onValueChange={(category_id) =>
                form.patchLine(line.id, { category_id })
              }
              categories={categories}
              placeholder="Категория"
              disabled={form.submitting}
            />
            {line.mode === 'PERCENT' ? (
              <Input
                value={line.percent}
                inputMode="decimal"
                placeholder="%"
                disabled={form.submitting}
                onChange={(event) =>
                  form.patchLine(line.id, { percent: event.target.value })
                }
              />
            ) : (
              <MoneyInput
                placeholder="Сумма"
                disabled={form.submitting}
                {...bindMoneyAmountField(line.amount, (amount) =>
                  form.patchLine(line.id, { amount }),
                )}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Удалить строку ${index + 1}`}
              disabled={form.submitting || form.values.lines.length <= 1}
              onClick={() => form.removeLine(line.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-amber-700">
          Сначала добавьте расходные или накопительные категории.
        </p>
      ) : null}
      {form.validationError ? (
        <p className="text-sm text-red-600">{form.validationError}</p>
      ) : null}
      {form.serverError ? (
        <p className="text-sm text-red-600">{form.serverError}</p>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          stackActions && 'flex-col *:w-full',
        )}
      >
        <Button
          type="submit"
          size="lg"
          isLoading={form.submitting}
          disabled={categories.length === 0}
          className="min-w-40"
        >
          {form.isEditing ? 'Сохранить' : 'Добавить правило'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={form.submitting}
            onClick={onCancel}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  )
}
