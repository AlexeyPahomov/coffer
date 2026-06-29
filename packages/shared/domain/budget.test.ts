import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  addToAllocated,
  addToSpent,
  bootstrapOpening,
  computeClosing,
  computeRemaining,
  isOverspent,
  recomputeSnapshot,
} from './budget.js'
import { computeCategoryBudgetsForPeriod } from './budgetRebuild.js'

describe('computeClosing', () => {
  it('matches envelope formula', () => {
    assert.equal(computeClosing(10_000, 50_000, 7_000), 53_000)
    assert.equal(computeRemaining(10_000, 50_000, 7_000), 53_000)
  })

  it('detects overspend', () => {
    assert.equal(isOverspent(computeClosing(0, 1_000, 2_000)), true)
    assert.equal(isOverspent(computeClosing(5_000, 1_000, 2_000)), false)
  })
})

describe('bootstrapOpening', () => {
  it('uses previous closing or zero', () => {
    assert.equal(bootstrapOpening(12_500), 12_500)
    assert.equal(bootstrapOpening(null), 0)
    assert.equal(bootstrapOpening(undefined), 0)
  })
})

describe('recomputeSnapshot', () => {
  it('never increments closing independently', () => {
    let state = recomputeSnapshot({
      openingBalance: 56_000,
      allocated: 0,
      spent: 0,
    })
    assert.equal(state.closingBalance, 56_000)

    state = recomputeSnapshot({
      openingBalance: state.openingBalance,
      allocated: state.allocated,
      spent: addToSpent(state.spent, 7_000),
    })
    assert.equal(state.closingBalance, 49_000)

    state = recomputeSnapshot({
      openingBalance: state.openingBalance,
      allocated: addToAllocated(state.allocated, 10_000),
      spent: state.spent,
    })
    assert.equal(state.closingBalance, 59_000)
  })
})

describe('computeCategoryBudgetsForPeriod', () => {
  it('does not attribute unallocated category spend to the envelope', () => {
    const [travel] = computeCategoryBudgetsForPeriod(
      [{ id: 'travel', type: 'expense', carry_over_policy: 'RESET' }],
      [],
      [{ category_id: 'travel', amount: 8_000, date: '2026-05-30' }],
      '2026-05',
    )

    assert.equal(travel?.spent, 8_000)
    assert.equal(travel?.closingBalance, 0)
  })

  it('does not carry reset expense overspend into the next month', () => {
    const [travel] = computeCategoryBudgetsForPeriod(
      [{ id: 'travel', type: 'expense', carry_over_policy: 'RESET' }],
      [],
      [{ category_id: 'travel', amount: 8_000, date: '2026-05-30' }],
      '2026-06',
    )

    assert.equal(travel?.openingBalance, 0)
    assert.equal(travel?.spent, 0)
    assert.equal(travel?.closingBalance, 0)
  })

  it('uses income period month when allocation period month is invalid', () => {
    const [apartment] = computeCategoryBudgetsForPeriod(
      [{ id: 'apt', type: 'expense', carry_over_policy: 'CARRY' }],
      [
        {
          category_id: 'apt',
          amount: 7_000,
          period_month: 'invalid',
          income_period_month: '2026-05-01',
        },
      ],
      [{ category_id: 'apt', amount: 1_000, date: '2026-05-15' }],
      '2026-05',
    )

    assert.equal(apartment?.allocated, 7_000)
    assert.equal(apartment?.spent, 1_000)
    assert.equal(apartment?.closingBalance, 6_000)
  })

  it('carries savings balance across months', () => {
    const [savings] = computeCategoryBudgetsForPeriod(
      [{ id: 'savings', type: 'savings', carry_over_policy: 'RESET' }],
      [{ category_id: 'savings', amount: 100_000, period_month: '2026-05-01' }],
      [],
      '2026-06',
    )

    assert.equal(savings?.openingBalance, 100_000)
    assert.equal(savings?.closingBalance, 100_000)
  })

  it('does not carry CARRY free-pool spend into the next month', () => {
    const [pet] = computeCategoryBudgetsForPeriod(
      [{ id: 'pet', type: 'expense', carry_over_policy: 'CARRY' }],
      [],
      [{ category_id: 'pet', amount: 21_000, date: '2026-06-22' }],
      '2026-06',
    )

    assert.equal(pet?.spent, 21_000)
    assert.equal(pet?.closingBalance, 0)

    const [petJuly] = computeCategoryBudgetsForPeriod(
      [{ id: 'pet', type: 'expense', carry_over_policy: 'CARRY' }],
      [],
      [{ category_id: 'pet', amount: 21_000, date: '2026-06-22' }],
      '2026-07',
    )

    assert.equal(petJuly?.openingBalance, 0)
    assert.equal(petJuly?.closingBalance, 0)
  })

  it('still carries CARRY envelope overspend into the next month', () => {
    const [pet] = computeCategoryBudgetsForPeriod(
      [{ id: 'pet', type: 'expense', carry_over_policy: 'CARRY' }],
      [{ category_id: 'pet', amount: 5_000, period_month: '2026-06-01' }],
      [{ category_id: 'pet', amount: 8_000, date: '2026-06-15' }],
      '2026-06',
    )

    assert.equal(pet?.closingBalance, -3_000)

    const [petJuly] = computeCategoryBudgetsForPeriod(
      [{ id: 'pet', type: 'expense', carry_over_policy: 'CARRY' }],
      [{ category_id: 'pet', amount: 5_000, period_month: '2026-06-01' }],
      [{ category_id: 'pet', amount: 8_000, date: '2026-06-15' }],
      '2026-07',
    )

    assert.equal(petJuly?.openingBalance, -3_000)
    assert.equal(petJuly?.closingBalance, -3_000)
  })
})
