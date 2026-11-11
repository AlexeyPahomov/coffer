import { describe, expect, it } from 'vitest'

import { resolvePlannedExpenseSavingsAmountError } from './plannedExpenseFormValues'

describe('resolvePlannedExpenseSavingsAmountError', () => {
  const base = { amount: '100000', savings_category_id: 'cat-savings' }

  it('без конверта накоплений ошибки нет', () => {
    expect(
      resolvePlannedExpenseSavingsAmountError({
        ...base,
        savings_category_id: '',
        savings_amount: '',
      }),
    ).toBeNull()
  })

  it('конверт выбран, сумма не указана — просит указать', () => {
    expect(
      resolvePlannedExpenseSavingsAmountError({ ...base, savings_amount: '' }),
    ).toMatch(/Укажите/)
  })

  it('доля больше суммы плана', () => {
    expect(
      resolvePlannedExpenseSavingsAmountError({
        ...base,
        savings_amount: '150000',
      }),
    ).toMatch(/больше суммы плана/)
  })

  it('корректная доля', () => {
    expect(
      resolvePlannedExpenseSavingsAmountError({
        ...base,
        savings_amount: '30000',
      }),
    ).toBeNull()
  })
})
