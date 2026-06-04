import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatPeriodMonthKeyFromDate,
  formatReceivedAtFromDate,
  resolveBudgetAsOfKey,
} from './budgetDateFormat.js'

describe('formatPeriodMonthKeyFromDate', () => {
  it('uses local calendar month', () => {
    const date = new Date(2026, 4, 15)
    assert.equal(formatPeriodMonthKeyFromDate(date), '2026-05')
  })
})

describe('formatReceivedAtFromDate', () => {
  it('uses local calendar day', () => {
    const date = new Date(2026, 5, 4)
    assert.equal(formatReceivedAtFromDate(date), '2026-06-04')
  })
})

describe('resolveBudgetAsOfKey', () => {
  it('accepts YYYY-MM-DD param', () => {
    assert.equal(resolveBudgetAsOfKey('2026-06-01'), '2026-06-01')
  })

  it('falls back to today when param is invalid', () => {
    const today = formatReceivedAtFromDate(new Date())
    assert.equal(resolveBudgetAsOfKey('not-a-date'), today)
  })
})
