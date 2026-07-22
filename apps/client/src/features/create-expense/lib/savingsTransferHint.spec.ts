import { describe, expect, it } from 'vitest'

import type { CategoryBudgetSnapshot } from '@/entities/budget'
import type { CategoryType } from '@/entities/category/model/types'

import type { ExpenseBudgetPreview } from '../model/budget'

import { buildSavingsFullFundingTransfer } from './savingsTransferHint'

function snapshot(
  over: Partial<CategoryBudgetSnapshot> & { categoryId: string },
): CategoryBudgetSnapshot {
  return {
    categoryName: over.categoryId,
    categoryType: 'expense',
    carriedFromPrevious: 0,
    allocated: 0,
    spent: 0,
    remaining: 0,
    ...over,
  }
}

function savings(id: string, remaining: number): CategoryBudgetSnapshot {
  return snapshot({
    categoryId: id,
    categoryType: 'savings',
    remaining,
  })
}

function preview(
  categoryId: string,
  amount: number,
  categoryType: CategoryType = 'expense',
): ExpenseBudgetPreview {
  return {
    categoryId,
    categoryName: categoryId,
    categoryType,
    allocated: 0,
    spent: 0,
    remainingBefore: 0,
    amount,
    remainingAfter: 0,
    isOverBudget: false,
    overAmount: 0,
  }
}

describe('buildSavingsFullFundingTransfer', () => {
  it('funds a limitless category by unpacking savings into the free pool', () => {
    const funding = buildSavingsFullFundingTransfer(
      [snapshot({ categoryId: 'misc' }), savings('acc', 5_000)],
      preview('misc', 1_000),
    )

    expect(funding).toEqual({
      savingsCategoryId: 'acc',
      amount: 1_000,
      toCategoryId: null,
    })
  })

  it('funds a limited envelope by transferring the full amount into it', () => {
    const funding = buildSavingsFullFundingTransfer(
      [
        snapshot({ categoryId: 'food', allocated: 500, remaining: 500 }),
        savings('acc', 5_000),
      ],
      preview('food', 1_000),
    )

    expect(funding?.toCategoryId).toBe('food')
    expect(funding?.amount).toBe(1_000)
  })

  it('treats a carried-over balance as a limit (transfers into the envelope)', () => {
    const funding = buildSavingsFullFundingTransfer(
      [
        snapshot({ categoryId: 'trip', carriedFromPrevious: 300, remaining: 300 }),
        savings('acc', 5_000),
      ],
      preview('trip', 1_000),
    )

    expect(funding?.toCategoryId).toBe('trip')
  })

  it('picks the savings envelope with the largest remaining', () => {
    const funding = buildSavingsFullFundingTransfer(
      [snapshot({ categoryId: 'misc' }), savings('small', 100), savings('big', 900)],
      preview('misc', 50),
    )

    expect(funding?.savingsCategoryId).toBe('big')
  })

  it('allows a savings envelope with insufficient (or negative) remaining', () => {
    const funding = buildSavingsFullFundingTransfer(
      [snapshot({ categoryId: 'misc' }), savings('acc', -200)],
      preview('misc', 1_000),
    )

    expect(funding).toMatchObject({ savingsCategoryId: 'acc', amount: 1_000 })
  })

  it('returns null when there is no savings envelope', () => {
    const funding = buildSavingsFullFundingTransfer(
      [snapshot({ categoryId: 'misc' })],
      preview('misc', 1_000),
    )
    expect(funding).toBeNull()
  })

  it('returns null for a savings category expense (no savings-to-savings funding)', () => {
    const funding = buildSavingsFullFundingTransfer(
      [savings('acc', 5_000), savings('acc2', 1_000)],
      preview('acc', 1_000, 'savings'),
    )
    expect(funding).toBeNull()
  })

  it('returns null without a preview', () => {
    const funding = buildSavingsFullFundingTransfer([savings('acc', 5_000)], null)
    expect(funding).toBeNull()
  })
})
