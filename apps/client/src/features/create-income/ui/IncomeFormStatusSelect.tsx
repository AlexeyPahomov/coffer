import {
  INCOME_STATUSES,
  INCOME_STATUS_LABELS,
  isIncomeStatus,
  type IncomeStatus,
} from '@coffer/shared'

import { Select } from '@/shared/ui'

import { incomeFormFieldClassName } from '../lib/incomeFormLayout'

type IncomeFormStatusSelectProps = {
  id?: string
  value: string
  onChange: (incomeStatus: IncomeStatus) => void
  disabled?: boolean
}

export function IncomeFormStatusSelect({
  id = 'income-status',
  value,
  onChange,
  disabled,
}: IncomeFormStatusSelectProps) {
  return (
    <Select
      id={id}
      value={value}
      onValueChange={(value) => {
        if (isIncomeStatus(value)) {
          onChange(value)
        }
      }}
      disabled={disabled}
      placeholder="Статус дохода"
      containerClassName={incomeFormFieldClassName}
      contentPosition="popper"
      options={INCOME_STATUSES.map((status) => ({
        value: status,
        label: INCOME_STATUS_LABELS[status],
      }))}
    />
  )
}
