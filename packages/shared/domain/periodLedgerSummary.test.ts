import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  computePeriodLedgerSummary,
  type ComputePeriodLedgerSummaryInput,
} from './periodLedgerSummary.js'

describe('computePeriodLedgerSummary', () => {
  it('computes month totals and zero opening pool for the first month', () => {
    const summary = computePeriodLedgerSummary({
      categories: [{ id: 'food', type: 'expense', carry_over_policy: 'RESET' }],
      allocations: [
        {
          category_id: 'food',
          amount: 20_000,
          period_month: '2026-06-01T00:00:00.000Z',
        },
      ],
      expenses: [
        {
          category_id: 'food',
          amount: 5_000,
          date: '2026-06-10T00:00:00.000Z',
        },
      ],
      incomes: [
        {
          amount: 100_000,
          period_month: '2026-06-01T00:00:00.000Z',
          status: 'RECEIVED',
        },
      ],
      periodMonth: '2026-06',
    })

    assert.equal(summary.periodMonth, '2026-06')
    assert.equal(summary.openingFreePool, 0)
    assert.equal(summary.incomeTotal, 100_000)
    assert.equal(summary.allocatedTotal, 20_000)
    assert.equal(summary.spentTotal, 5_000)
    assert.equal(summary.savingsReserveBalance, 0)
  })

  it('carries the prior-month free pool into the next month opening', () => {
    // Июнь (первый месяц): 100000 доход − 20000 распределено − 0 свободных
    //   трат + 0 перерасхода = 80000 свободного пула на конец июня.
    const summary = computePeriodLedgerSummary({
      categories: [{ id: 'food', type: 'expense', carry_over_policy: 'RESET' }],
      allocations: [
        {
          category_id: 'food',
          amount: 20_000,
          period_month: '2026-06-01T00:00:00.000Z',
        },
      ],
      expenses: [
        {
          category_id: 'food',
          amount: 5_000,
          date: '2026-06-10T00:00:00.000Z',
        },
      ],
      incomes: [
        {
          amount: 100_000,
          period_month: '2026-06-01T00:00:00.000Z',
          status: 'RECEIVED',
        },
      ],
      periodMonth: '2026-07',
    })

    assert.equal(summary.openingFreePool, 80_000)
    // В июле своих событий нет — итоги месяца нулевые.
    assert.equal(summary.incomeTotal, 0)
    assert.equal(summary.allocatedTotal, 0)
    assert.equal(summary.spentTotal, 0)
  })

  // Один и тот же сценарий: распределение 10000 в июне, трата 15000 в июле.
  // Политика переноса различает, спишется ли трата с конверта (CARRY) или
  // уйдёт из свободного пула (RESET).
  const buildCarryScenario = (
    policy: 'RESET' | 'CARRY',
  ): ComputePeriodLedgerSummaryInput => ({
    categories: [{ id: 'travel', type: 'expense', carry_over_policy: policy }],
    allocations: [
      {
        category_id: 'travel',
        amount: 10_000,
        period_month: '2026-06-01T00:00:00.000Z',
      },
    ],
    expenses: [
      {
        category_id: 'travel',
        amount: 15_000,
        date: '2026-07-10T00:00:00.000Z',
      },
    ],
    incomes: [
      {
        amount: 100_000,
        period_month: '2026-06-01T00:00:00.000Z',
        status: 'RECEIVED',
      },
    ],
    periodMonth: '2026-07',
  })

  it('RESET: июльская трата без лимита уходит из свободного пула', () => {
    const summary = computePeriodLedgerSummary(buildCarryScenario('RESET'))

    // RESET: opening июля = 0, лимита конверта нет → трата 15000 свободная.
    assert.equal(summary.openingFreePool, 90_000)
    assert.equal(summary.spentTotal, 15_000)
    assert.equal(summary.freePoolExpenseTotal, 15_000)
    assert.equal(summary.overspendCharge, 0)
    assert.deepEqual(summary.nonEnvelopeSpentByCategoryId, { travel: 15_000 })
  })

  it('CARRY: остаток конверта переносится, трата создаёт перерасход', () => {
    const summary = computePeriodLedgerSummary(buildCarryScenario('CARRY'))

    // CARRY: opening июля = 10000 (перенос), трата 15000 списывается с конверта
    //   → closing −5000 (перерасход), из свободного пула ничего.
    assert.equal(summary.openingFreePool, 90_000)
    assert.equal(summary.spentTotal, 15_000)
    assert.equal(summary.freePoolExpenseTotal, 0)
    assert.equal(summary.overspendCharge, -5_000)
    assert.deepEqual(summary.nonEnvelopeSpentByCategoryId, {})
  })

  it('CARRY: перерасход не списывается из пула повторно в следующем месяце', () => {
    // Тот же CARRY-сценарий, но смотрим на АВГУСТ — месяц после перерасхода,
    // без единого нового события (просто наступил новый месяц). Перерасход
    // −5000 уже «съел» свободный пул в июле; повторно вычитать его из
    // свободных средств нельзя, иначе −5000 повторяется/накапливается каждый
    // следующий месяц, пока долг конверта висит.
    const summary = computePeriodLedgerSummary({
      ...buildCarryScenario('CARRY'),
      periodMonth: '2026-08',
    })

    // Перенос из июля = 85000 (90000 − 5000 перерасхода, списанного один раз).
    assert.equal(summary.openingFreePool, 85_000)
    assert.equal(summary.incomeTotal, 0)
    assert.equal(summary.allocatedTotal, 0)
    assert.equal(summary.freePoolExpenseTotal, 0)
    // Долг конверта −5000 переносится на карточку (opening = closing = −5000),
    // но нового перерасхода в августе нет → заряд пула = 0.
    assert.equal(summary.overspendCharge, 0)

    const available =
      summary.openingFreePool +
      summary.incomeTotal -
      summary.allocatedTotal -
      summary.freePoolExpenseTotal +
      summary.overspendCharge
    assert.equal(available, 85_000)
  })

  it('savings reserve = распределено − потрачено по накоплениям за все месяцы', () => {
    const summary = computePeriodLedgerSummary({
      categories: [
        { id: 'vacation', type: 'savings', carry_over_policy: 'CARRY' },
      ],
      allocations: [
        {
          category_id: 'vacation',
          amount: 30_000,
          period_month: '2026-06-01T00:00:00.000Z',
        },
        {
          category_id: 'vacation',
          amount: 20_000,
          period_month: '2026-07-01T00:00:00.000Z',
        },
      ],
      expenses: [
        {
          category_id: 'vacation',
          amount: 10_000,
          date: '2026-07-10T00:00:00.000Z',
        },
      ],
      incomes: [],
      periodMonth: '2026-07',
    })

    // 30000 + 20000 распределено − 10000 потрачено = 40000 (не зависит от
    // фильтра по periodMonth).
    assert.equal(summary.savingsReserveBalance, 40_000)
  })

  it('savings reserve floored at 0 when spent exceeds allocated', () => {
    const summary = computePeriodLedgerSummary({
      categories: [
        { id: 'vacation', type: 'savings', carry_over_policy: 'CARRY' },
      ],
      allocations: [
        {
          category_id: 'vacation',
          amount: 10_000,
          period_month: '2026-06-01T00:00:00.000Z',
        },
      ],
      expenses: [
        {
          category_id: 'vacation',
          amount: 25_000,
          date: '2026-06-10T00:00:00.000Z',
        },
      ],
      incomes: [],
      periodMonth: '2026-06',
    })

    assert.equal(summary.savingsReserveBalance, 0)
  })
})
